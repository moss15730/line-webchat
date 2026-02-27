'use client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    loadMessages()
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [selectedUser])

  const loadMessages = async () => {
    const res = await fetch(`/api/messages?userId=${selectedUser.line_user_id}`)
    const data = await res.json()
    setMessages(data)
  }

  const sendMessage = async () => {
    await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUser.line_user_id,
        message: text,
      }),
    })
    setText('')
    loadMessages()
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '30%', borderRight: '1px solid #ccc' }}>
        {users.map(user => (
          <div key={user.id}
            onClick={() => setSelectedUser(user)}
            style={{ padding: 10, cursor: 'pointer' }}>
            {user.display_name}
          </div>
        ))}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, padding: 20 }}>
        {messages.map(msg => (
          <div key={msg.id}
            style={{
              textAlign: msg.sender === 'admin' ? 'right' : 'left'
            }}>
            {msg.message}
          </div>
        ))}

        {selectedUser && (
          <div style={{ marginTop: 20 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        )}
      </div>
    </div>
  )
}