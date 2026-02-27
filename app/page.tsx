'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type ChatUser = {
  id: number
  line_user_id: string
  display_name: string | null
  picture_url: string | null
}

type ChatMessage = {
  id: number
  line_user_id: string
  sender: 'admin' | 'user' | 'customer'
  message: string
  created_at: string
}

export default function Home() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (isCheckingAuth) return

    fetch('/api/users')
      .then(res => {
        if (!res.ok) {
          router.replace('/login')
          return [] as ChatUser[]
        }
        return res.json()
      })
      .then((data: ChatUser[]) => setUsers(data))
  }, [isCheckingAuth, router])

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return

    await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUser.line_user_id,
        message: text,
      }),
    })

    setText('')
  }

  const handleSelectUser = async (user: ChatUser) => {
    setSelectedUser(user)

    const res = await fetch(`/api/messages?userId=${user.line_user_id}`)
    if (!res.ok) {
      router.replace('/login')
      return
    }

    const data: ChatMessage[] = await res.json()
    setMessages(data)
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isCheckingAuth) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Checking session...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="w-72 bg-white border-r overflow-y-auto">
        <div className="p-5 font-semibold border-b flex items-center justify-between gap-2">
          <span>Customers</span>
          <button
            onClick={signOut}
            className="text-xs border rounded px-2 py-1 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>

        {users.map(user => (
          <div
            key={user.id}
            onClick={() => handleSelectUser(user)}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100
              ${selectedUser?.id === user.id && 'bg-gray-100'}
            `}
          >
            <Image
              src={user.picture_url || '/file.svg'}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              alt={user.display_name || 'avatar'}
              unoptimized
            />
            <div className="text-sm font-medium">
              {user.display_name || 'Unknown'}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col flex-1">
        <div className="p-5 bg-white border-b font-medium">
          {selectedUser
            ? selectedUser.display_name
            : 'Select a conversation'}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'admin'
                  ? 'items-end'
                  : 'items-start'
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs text-sm
                  ${
                    msg.sender === 'admin'
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-black'
                  }
                `}
              >
                {msg.message}
              </div>

              <span className="text-xs text-gray-400 mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {selectedUser && (
          <div className="p-4 bg-white border-t flex gap-3">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={sendMessage}
              className="bg-black text-white px-6 py-2 rounded-full hover:opacity-80"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  )
}