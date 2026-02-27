import Image from 'next/image'
import { Menu } from 'lucide-react'
import type { ChatUser } from '../types/chat'
import { getInitials } from '../lib/chatUtils'

type ChatHeaderProps = {
  selectedUser: ChatUser | null
  onOpenSidebar: () => void
}

export function ChatHeader({ selectedUser, onOpenSidebar }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-5">
      {selectedUser ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="mr-1 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          {selectedUser.picture_url ? (
            <Image
              src={selectedUser.picture_url}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              alt={selectedUser.display_name || 'avatar'}
              unoptimized
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white font-semibold">
              {getInitials(selectedUser.display_name)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {selectedUser.display_name || 'Unknown'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-slate-500">เลือกแชทเพื่อเริ่มสนทนา</p>
      )}
    </header>
  )
}

