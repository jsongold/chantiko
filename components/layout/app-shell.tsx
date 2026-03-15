"use client"

import { Header } from "@/components/layout/header"
import { FooterNav } from "@/components/layout/footer-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <FooterNav />
    </div>
  )
}
