'use client'
import { useState } from 'react'

export default function Home() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    setLoading(true)

    await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    setMessage('')
    setLoading(false)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>LINE OA WebChat</h1>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="พิมพ์ข้อความ..."
        style={{ padding: 10, width: 300 }}
      />

      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  )
}