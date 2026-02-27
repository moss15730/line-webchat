import Image from 'next/image'
import type { ChatMessage, ChatUser } from '../types/chat'
import { formatMessageTime, getInitials } from '../lib/chatUtils'

type ChatMessagesProps = {
  messages: ChatMessage[]
  selectedUser: ChatUser | null
  messagesEndRef: React.RefObject<HTMLDivElement>
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function ChatMessages({
  messages,
  selectedUser,
  messagesEndRef,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ChatMessagesProps) {
  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    if (!onLoadMore || !hasMore || isLoadingMore) return
    const target = event.currentTarget
    if (target.scrollTop <= 48) {
      onLoadMore()
    }
  }

  return (
    <section className="flex-1 overflow-y-auto bg-slate-50 px-6 py-5" onScroll={handleScroll}>
      {hasMore && (
        <div className="mb-3 flex justify-center">
          {isLoadingMore ? (
            <div className="h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-sky-500" />
          ) : (
            <div className="h-px w-12 rounded-full bg-slate-200" />
          )}
        </div>
      )}
      {messages.map((msg, index) => {
        const isAdmin = msg.sender === 'admin'
        const currentTime = new Date(msg.created_at).getTime()

        const prev = index > 0 ? messages[index - 1] : null
        const next = index < messages.length - 1 ? messages[index + 1] : null

        const prevTime = prev ? new Date(prev.created_at).getTime() : null
        const nextTime = next ? new Date(next.created_at).getTime() : null

        const sameSenderAsPrev = !!prev && prev.sender === msg.sender
        const closeToPrev = !!prevTime && currentTime - prevTime <= 60_000

        const sameSenderAsNext = !!next && next.sender === msg.sender
        const closeToNext = !!nextTime && nextTime - currentTime <= 60_000

        const isFirstOfGroup = !(sameSenderAsPrev && closeToPrev)
        const isLastOfGroup = !(sameSenderAsNext && closeToNext)

        const marginTopClass =
          index === 0 ? '' : isFirstOfGroup ? 'mt-4' : 'mt-1'

        return (
          <div
            key={msg.id}
            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${marginTopClass}`}
          >
            {!isAdmin &&
              (selectedUser?.picture_url ? (
                <Image
                  src={selectedUser.picture_url}
                  width={28}
                  height={28}
                  className="mr-2 mt-auto h-7 w-7 shrink-0 rounded-full object-cover"
                  alt="avatar"
                  unoptimized
                />
              ) : (
                <div className="mr-2 mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs text-white">
                  {getInitials(selectedUser?.display_name || null)}
                </div>
              ))}
            <div
                className={`flex max-w-[65%] flex-col ${
                isAdmin ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isAdmin
                    ? 'bg-linear-to-r from-sky-500 to-blue-600 text-white'
                    : 'bg-white text-slate-900'
                }`}
              >
                {msg.message}
              </div>
              {isLastOfGroup && (
                <span className="mt-1 px-1 text-[10px] text-slate-500">
                  {formatMessageTime(msg.created_at)}
                </span>
              )}
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </section>
  )
}

