import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const loginErrorUrl = `${origin}/auth/login?error=callback_failed`
  const supabase = await createServerSupabaseClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(loginErrorUrl)
    }
  } else if (token_hash && type) {
    const validTypes = ["email", "magiclink"] as const
    if (!validTypes.includes(type as typeof validTypes[number])) {
      return NextResponse.redirect(loginErrorUrl)
    }
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "magiclink",
    })
    if (error) {
      return NextResponse.redirect(loginErrorUrl)
    }
  } else {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  return NextResponse.redirect(`${origin}/activity`)
}
