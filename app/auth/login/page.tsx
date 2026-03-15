"use client"

import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Chantiko</h1>
          <p className="text-sm text-muted-foreground">
            Track activities and manage goals
          </p>
        </div>
        <Button onClick={handleGoogleLogin} className="w-full" size="lg">
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
