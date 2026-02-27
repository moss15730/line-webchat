import Image from 'next/image'
import { Search, X } from 'lucide-react'
import type { ChatUser } from '../types/chat'
import { avatarColors, getInitials } from '../lib/chatUtils'

type MobileChatSidebarProps = {
  isOpen: boolean
  users: ChatUser[]
  selectedUser: ChatUser | null
  search: string
  onSearchChange: (value: string) => void
  activeFilter: string
  filters: readonly string[]
  onFilterChange: (value: string) => void
  onSelectUser: (user: ChatUser) => void
  onSignOut: () => void
  onClose: () => void
}

export function MobileChatSidebar({
  isOpen,
  users,
  selectedUser,
  search,
  onSearchChange,
  activeFilter,
  filters,
  onFilterChange,
  onSelectUser,
  onSignOut,
  onClose,
}: MobileChatSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside className="relative z-50 flex h-full w-80 max-w-full flex-col border-r border-slate-200 bg-white backdrop-blur">
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">แชท</h1>
          </div>
          <button
            onClick={onSignOut}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="ค้นหา"
              className="w-full rounded-full bg-slate-100 px-4 py-2 pl-9 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500/80"
            />
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 text-xs font-medium text-slate-500 scrollbar-hide">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`shrink-0 rounded-full px-3 py-1.5 transition-colors ${
                activeFilter === filter
                  ? 'bg-sky-100 text-sky-700'
                  : 'hover:bg-slate-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
          {users.map((user, i) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                selectedUser?.id === user.id ? 'bg-sky-50' : 'hover:bg-slate-50'
              }`}
            >
              {user.read === false && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
              )}
              <div className="relative">
                {user.picture_url ? (
                  <Image
                    src={user.picture_url}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                    alt={user.display_name || 'avatar'}
                    unoptimized
                  />
                ) : (
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      avatarColors[i % avatarColors.length]
                    } text-white font-semibold`}
                  >
                    {getInitials(user.display_name)}
                  </div>
                )}
                {user.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.display_name || 'Unknown'}
                  </p>
                  {user.last_time && (
                    <span className="ml-2 shrink-0 text-xs text-slate-400">{user.last_time}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <p
                    className={`truncate text-xs ${
                      user.read === false ? 'font-semibold text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {user.last_message || user.line_user_id}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

