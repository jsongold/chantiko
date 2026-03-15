import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = ["/auth/login", "/auth/callback"]

export async function proxy(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
    const { pathname } = request.nextUrl
    const isAuthPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/activity"
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const isAuthPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Check for Supabase auth cookies (sb-*-auth-token pattern)
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"))

  if (!hasAuthCookie && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (hasAuthCookie && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/activity"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
