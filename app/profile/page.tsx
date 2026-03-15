"use client"

import { useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { useAuth } from "@/hooks/useAuth"
import { useSettingsStore, LLM_MODELS, type LLMModel } from "@/store/settingsStore"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { LogOutIcon, UserIcon } from "lucide-react"

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

function UserAvatar({ avatarUrl, displayName }: { avatarUrl: string | null; displayName: string }) {
  if (avatarUrl && isValidImageUrl(avatarUrl)) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className="size-16 rounded-full object-cover"
      />
    )
  }

  return (
    <div className="flex size-16 items-center justify-center rounded-full bg-muted">
      <UserIcon className="size-8 text-muted-foreground" />
    </div>
  )
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const { aiEnabled, setAIEnabled, llmModel, setLLMModel } = useSettingsStore()

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }, [])

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-4">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        </div>
      </AppShell>
    )
  }

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "User"
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null
  const email = user?.email ?? ""

  return (
    <AppShell>
      <div className="p-4">
        <h2 className="text-lg font-semibold">Profile</h2>

        <div className="mt-4 flex items-center gap-4">
          <UserAvatar avatarUrl={avatarUrl} displayName={displayName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Settings</h3>

          <div className="flex items-center gap-3">
            <Checkbox
              id="ai-toggle"
              checked={aiEnabled}
              onCheckedChange={(checked) => {
                setAIEnabled(Boolean(checked))
              }}
            />
            <Label htmlFor="ai-toggle" className="font-normal">
              Enable AI features
            </Label>
          </div>

          {aiEnabled && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">AI Model</Label>
              <Select
                value={llmModel}
                onValueChange={(val) => setLLMModel(val as LLMModel)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOutIcon className="mr-2 size-4" />
          Sign out
        </Button>
      </div>
    </AppShell>
  )
}
