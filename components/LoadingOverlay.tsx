type LoadingOverlayProps = {
  message?: string
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-md">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
        {message && (
          <p className="text-xs font-medium text-slate-600">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

