export type ChatUser = {
  id: number
  line_user_id: string
  display_name: string | null
  picture_url: string | null
  last_message?: string
  last_time?: string
  unread?: boolean
  /** true = อ่านแล้ว, false = ยังไม่อ่าน */
  read?: boolean
  online?: boolean
}

export type ChatMessage = {
  id: number
  line_user_id: string
  sender: 'admin' | 'user' | 'customer'
  message: string
  created_at: string
}

