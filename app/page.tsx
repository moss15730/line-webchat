'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ChatMessage, ChatUser } from '../types/chat'
import { filters, formatMessageTime } from '../lib/chatUtils'
import { supabaseBrowser } from '../lib/supabase-browser'
import { ChatSidebar } from '../components/ChatSidebar'
import { MobileChatSidebar } from '../components/MobileChatSidebar'
import { ChatHeader } from '../components/ChatHeader'
import { ChatMessages } from '../components/ChatMessages'
import { ChatInput } from '../components/ChatInput'
import { LoadingOverlay } from '../components/LoadingOverlay'

export default function Home() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>(filters[0])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null!)
  const selectedUserIdRef = useRef<string | null>(null)
  const usersRef = useRef<ChatUser[]>([])
  const lastMessageCreatedAtRef = useRef<string>('')
  selectedUserIdRef.current = selectedUser?.line_user_id ?? null
  usersRef.current = users
  lastMessageCreatedAtRef.current =
    messages.length > 0 ? messages[messages.length - 1].created_at : ''

  const PAGE_SIZE = 30

  const updateUserPreview = useCallback(
    (lineUserId: string, message: string, createdAt: string) => {
      setUsers(prev =>
        prev.map(user =>
          user.line_user_id === lineUserId
            ? {
                ...user,
                last_message: message,
                last_time: formatMessageTime(createdAt),
                last_created_at: createdAt,
              }
            : user
        )
      )
    },
    []
  )

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        router.replace('/login')
        return
      }
      setIsCheckingAuth(false)
    }
    checkSession()
  }, [router])

  const handleSelectUser = useCallback(
    async (user: ChatUser) => {
      setSelectedUser(user)
      setIsSidebarOpen(false)
      setHasMore(true)
      setIsPageLoading(true)
      try {
        const res = await fetch(`/api/messages?userId=${user.line_user_id}&limit=${PAGE_SIZE}`)
        if (!res.ok) {
          router.replace('/login')
          return
        }
        const data: ChatMessage[] = await res.json()
        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        setMessages(sorted)
        if (sorted.length > 0) {
          const last = sorted[sorted.length - 1]
          updateUserPreview(user.line_user_id, last.message, last.created_at)
        }
        if (data.length < PAGE_SIZE) {
          setHasMore(false)
        }
        const readRes = await fetch('/api/users/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line_user_id: user.line_user_id, read: true }),
        })
        if (readRes.ok) {
          fetch('/api/users', { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : []))
            .then((data: ChatUser[]) => {
              setUsers(data)
              setSelectedUser(prev =>
                prev ? data.find(u => u.line_user_id === prev.line_user_id) ?? prev : null
              )
            })
            .catch(() => {})
        } else {
          setUsers(prev =>
            prev.map(u =>
              u.line_user_id === user.line_user_id ? { ...u, read: true } : u
            )
          )
        }
      } finally {
        setIsPageLoading(false)
      }
    },
    [PAGE_SIZE, router, updateUserPreview]
  )

  useEffect(() => {
    if (isCheckingAuth || hasInitialized) return
    fetch('/api/users', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) {
          router.replace('/login')
          return [] as ChatUser[]
        }
        return res.json()
      })
      .then((data: ChatUser[]) => {
        setUsers(data)
        setHasInitialized(true)
      })
  }, [handleSelectUser, hasInitialized, isCheckingAuth, router])

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUser.line_user_id,
        message: text,
      }),
    })
    if (!res.ok) return
    const optimisticMessage: ChatMessage = {
      id: Date.now(),
      line_user_id: selectedUser.line_user_id,
      sender: 'admin',
      message: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMessage])
    updateUserPreview(
      selectedUser.line_user_id,
      optimisticMessage.message,
      optimisticMessage.created_at
    )
    setText('')
    fetch('/api/users', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : []))
      .then((data: ChatUser[]) => {
        setUsers(data)
        setSelectedUser(prev =>
          prev ? data.find(u => u.line_user_id === prev.line_user_id) ?? prev : null
        )
      })
      .catch(() => {})
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages])

  useEffect(() => {
    if (isCheckingAuth || !supabaseBrowser) return

    const channel = supabaseBrowser
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new
          const lineUserId = row?.line_user_id as string | undefined
          const message = row?.message as string | undefined
          const created_at = row?.created_at as string | undefined
          const id = row?.id as number | undefined
          const sender = (row?.sender as ChatMessage['sender']) ?? 'customer'

          if (!lineUserId || message == null || created_at == null) return

          const newMsg: ChatMessage = {
            id: id ?? 0,
            line_user_id: lineUserId,
            sender,
            message,
            created_at,
          }

          const isNewUser = !usersRef.current.some(u => u.line_user_id === lineUserId)
          if (isNewUser) {
            fetch('/api/users', { cache: 'no-store' })
              .then(res => (res.ok ? res.json() : []))
              .then((data: ChatUser[]) => setUsers(data))
              .catch(() => {})
          } else {
            setUsers(prev =>
              prev.map(u =>
                u.line_user_id === lineUserId
                  ? {
                      ...u,
                      last_message: message,
                      last_time: formatMessageTime(created_at),
                      read: false,
                    }
                  : u
              )
            )
          }

          if (selectedUserIdRef.current === lineUserId) {
            setMessages(prev => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    return () => {
      if (supabaseBrowser) supabaseBrowser.removeChannel(channel)
    }
  }, [isCheckingAuth])

  const POLL_FULL_REFRESH_MS = 60000

  // รีเฟรชทันทีเมื่อกลับมาเปิดแท็บ (หลัง webhook insert ข้อความจาก LINE แล้ว)
  useEffect(() => {
    if (isCheckingAuth) return
    const refresh = () => {
      fetch('/api/users', { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : []))
        .then((data: ChatUser[]) => {
          setUsers(data)
          setSelectedUser(prev =>
            prev ? data.find(u => u.line_user_id === prev.line_user_id) ?? prev : null
          )
        })
        .catch(() => {})
      const lineUserId = selectedUserIdRef.current
      if (lineUserId) {
        fetch(`/api/messages?userId=${lineUserId}&limit=${PAGE_SIZE}`)
          .then(res => (res.ok ? res.json() : []))
          .then((data: ChatMessage[]) => {
            const sorted = [...data].sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            setMessages(sorted)
            if (sorted.length > 0) {
              const last = sorted[sorted.length - 1]
              updateUserPreview(lineUserId, last.message, last.created_at)
            }
          })
          .catch(() => {})
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isCheckingAuth, PAGE_SIZE, updateUserPreview])

  useEffect(() => {
    if (isCheckingAuth) return

    const pollUsers = () => {
      fetch('/api/users', { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : []))
        .then((data: ChatUser[]) => {
          setUsers(data)
          setSelectedUser(prev =>
            prev ? data.find(u => u.line_user_id === prev.line_user_id) ?? prev : null
          )
        })
        .catch(() => {})
    }

    const timer = setInterval(pollUsers, POLL_FULL_REFRESH_MS)
    pollUsers()
    return () => clearInterval(timer)
  }, [isCheckingAuth])

  useEffect(() => {
    if (isCheckingAuth || !selectedUser) return
    const lineUserId = selectedUser.line_user_id

    const pollMessages = () => {
      fetch(`/api/messages?userId=${lineUserId}&limit=${PAGE_SIZE}`)
        .then(res => (res.ok ? res.json() : []))
        .then((data: ChatMessage[]) => {
          const sorted = [...data].sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          setMessages(sorted)
          if (sorted.length > 0) {
            const last = sorted[sorted.length - 1]
            updateUserPreview(lineUserId, last.message, last.created_at)
          }
        })
        .catch(() => {})
    }

    const timer = setInterval(pollMessages, POLL_FULL_REFRESH_MS)
    pollMessages()
    return () => clearInterval(timer)
  }, [PAGE_SIZE, isCheckingAuth, selectedUser?.line_user_id, updateUserPreview])

  const loadMoreMessages = useCallback(async () => {
    if (!selectedUser || isLoadingMore || !hasMore || messages.length === 0) return

    const oldest = messages[0]
    setIsLoadingMore(true)
    const params = new URLSearchParams({
      userId: selectedUser.line_user_id,
      limit: String(PAGE_SIZE),
      before: oldest.created_at,
    })
    const res = await fetch(`/api/messages?${params.toString()}`)
    if (!res.ok) {
      setIsLoadingMore(false)
      return
    }
    const data: ChatMessage[] = await res.json()
    if (data.length === 0) {
      setHasMore(false)
      setIsLoadingMore(false)
      return
    }
    const combined = [...data, ...messages]
    const uniqueById = combined.reduce<ChatMessage[]>((acc, msg) => {
      if (!acc.find(existing => existing.id === msg.id)) {
        acc.push(msg)
      }
      return acc
    }, [])
    uniqueById.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    setMessages(uniqueById)
    if (data.length < PAGE_SIZE) {
      setHasMore(false)
    }
    setIsLoadingMore(false)
  }, [PAGE_SIZE, hasMore, isLoadingMore, messages, selectedUser])

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-top-sky-500" />
          <span>Checking session...</span>
        </div>
      </div>
    )
  }

  const filteredUsers = users
    .slice()
    .sort((a, b) => {
      const at = a.last_created_at ? new Date(a.last_created_at).getTime() : 0
      const bt = b.last_created_at ? new Date(b.last_created_at).getTime() : 0
      return bt - at
    })
    .filter(user => {
      const displayName = (user.display_name || 'Unknown').toLowerCase()
      const matchSearch = displayName.includes(search.toLowerCase())
      if (activeFilter === 'ยังไม่ได้อ่าน') return matchSearch && user.read === false
      return matchSearch
    })

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50 font-['Sarabun',sans-serif] text-slate-900 md:flex-row">
      {isPageLoading && <LoadingOverlay message="กำลังโหลดข้อความ..." />}
      {/* Sidebar */}
      <ChatSidebar
        users={filteredUsers}
        selectedUser={selectedUser}
        search={search}
        onSearchChange={setSearch}
        activeFilter={activeFilter}
        filters={filters}
        onFilterChange={setActiveFilter}
        onSelectUser={handleSelectUser}
        onSignOut={signOut}
      />

      {/* Chat Area */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <ChatHeader selectedUser={selectedUser} onOpenSidebar={() => setIsSidebarOpen(true)} />

        <ChatMessages
          messages={messages}
          selectedUser={selectedUser}
          messagesEndRef={messagesEndRef}
          onLoadMore={loadMoreMessages}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
        />

        {selectedUser && (
          <ChatInput
            text={text}
            onTextChange={setText}
            onSend={sendMessage}
            disabled={isCheckingAuth}
          />
        )}
      </main>

      <MobileChatSidebar
        isOpen={isSidebarOpen}
        users={filteredUsers}
        selectedUser={selectedUser}
        search={search}
        onSearchChange={setSearch}
        activeFilter={activeFilter}
        filters={filters}
        onFilterChange={setActiveFilter}
        onSelectUser={handleSelectUser}
        onSignOut={signOut}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  )
}
