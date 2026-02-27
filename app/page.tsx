'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseClient: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
)

export default function Home() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // โหลด users
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
  }, [])

  // โหลด messages + realtime
  useEffect(() => {
    if (!selectedUser) return

    loadMessages()

    const channel = supabaseClient
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `line_user_id=eq.${selectedUser.line_user_id}`,
        },
        (payload: { new: any }) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [selectedUser])

  const loadMessages = async () => {
    const res = await fetch(
      `/api/messages?userId=${selectedUser.line_user_id}`
    )
    const data = await res.json()
    setMessages(data)
  }

  const sendMessage = async () => {
    if (!text.trim()) return

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

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* Sidebar */}
      <div className="w-72 bg-white border-r overflow-y-auto">
        <div className="p-5 font-semibold border-b">
          Customers
        </div>

        {users.map(user => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100
              ${selectedUser?.id === user.id && 'bg-gray-100'}
            `}
          >
            <img
              src={user.picture_url || '/avatar.png'}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="text-sm font-medium">
              {user.display_name || 'Unknown'}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">
        
        {/* Header */}
        <div className="p-5 bg-white border-b font-medium">
          {selectedUser
            ? selectedUser.display_name
            : 'Select a conversation'}
        </div>

        {/* Messages */}
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

        {/* Input */}
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