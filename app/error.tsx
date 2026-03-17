"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("[Chantiko]", error.message)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <button
        onClick={reset}
        className="rounded-md bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700"
      >
        Try again
      </button>
    </div>
  )
}
