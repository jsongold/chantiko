"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, User } from "lucide-react"

export function BurgerMenu() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <Button
        variant="ghost"
        className="justify-start"
        onClick={() => router.push("/profile")}
      >
        <User className="mr-2 h-4 w-4" />
        Profile
      </Button>
      <Separator />
      <Button
        variant="ghost"
        className="justify-start text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  )
}
