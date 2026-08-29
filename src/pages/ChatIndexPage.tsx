export function ChatIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-base font-semibold text-slate-900">No conversation selected</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick a conversation from the sidebar, or start a new one.
        </p>
      </div>
    </div>
  )
}

export default ChatIndexPage
