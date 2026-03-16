"use client"

import { useCallback, useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEmailLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const trimmed = email.trim()
      if (!trimmed) return

      setIsLoading(true)
      setError(null)
      setMessage(null)

      try {
        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (authError) {
          setError(authError.message)
        } else {
          setMessage("Check your email for the login link!")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [email]
  )

  const handleGoogleLogin = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Chantiko</h1>
          <p className="text-sm text-muted-foreground">
            Track activities and manage goals
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? "Sending..." : "Sign in with Email"}
          </Button>
        </form>

        {message && (
          <p className="text-sm text-green-600">{message}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
