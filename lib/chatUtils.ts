import type { ChatMessage } from '../types/chat'

export const filters = [
  'ทั้งหมด'
  , 'ยังไม่ได้อ่าน'
] as const

export const formatMessageTime = (dateString: ChatMessage['created_at']) =>
  new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

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

