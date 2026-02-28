import type { ChatMessage } from '../types/chat'

export const filters = [
  'ทั้งหมด'
  , 'ยังไม่ได้อ่าน'
] as const

const BANGKOK_TZ = 'Asia/Bangkok'

function parseAsUTC(dateString: string): Date {
  const s = dateString.trim()
  if (/Z$|[-+]\d{2}:?\d{2}$/.test(s)) return new Date(s)
  return new Date(s + (s.includes('T') ? 'Z' : 'Z'))
}

export const formatMessageTime = (dateString: ChatMessage['created_at']) => {
  const d = parseAsUTC(dateString)
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BANGKOK_TZ,
  })
}

export const avatarColors = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-cyan-600',
  'bg-orange-600',
  'bg-teal-600',
] as const

export const getInitials = (name: string | null) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

