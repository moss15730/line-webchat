'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingOverlay } from '@/components/LoadingOverlay'

export default function LoginPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (res.ok) {
          router.replace('/')
        } else {
          setCheckingSession(false)
        }
      })
      .catch(() => {
        setCheckingSession(false)
      })
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    })

    setLoading(false)

    if (!response.ok) {
      const data = await response.json()
      setError(data.error || 'Login failed')
      return
    }

    router.replace('/')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4">
      {(checkingSession || loading) && <LoadingOverlay message="กำลังโหลด..." />}
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">ระบบ Web Chat - LINE</h1>
        <p className="mt-2 text-sm text-slate-500">เข้าสู่ระบบเพื่อจัดการแชท</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-offset-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-offset-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-600 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}