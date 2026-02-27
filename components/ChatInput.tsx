import { Send } from 'lucide-react'

type ChatInputProps = {
  text: string
  onTextChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export function ChatInput({ text, onTextChange, onSend, disabled }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && text.trim()) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <footer className="border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-full bg-slate-100 px-4 py-2">
          <input
            value={text}
            onChange={e => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={onSend}
          disabled={disabled || !text.trim()}
          className="rounded-full p-2 text-sky-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </footer>
  )
}

