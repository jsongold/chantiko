"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Activity, Target, ListChecks, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { features } from "@/lib/features"

const ALL_NAV_ITEMS = [
  { href: "/activity", label: "Activity", icon: Activity, feature: null },
  { href: "/tasks", label: "Tasks", icon: ListChecks, feature: "tasks" as const },
  { href: "/g", label: "Goals", icon: Target, feature: "goals" as const },
  { href: "/progress", label: "Progress", icon: BarChart3, feature: "progress" as const },
]

const NAV_ITEMS = ALL_NAV_ITEMS.filter(
  (item) => item.feature === null || features[item.feature]
)

export function FooterNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 z-50 border-t bg-background">
      <div className="flex h-14 items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 text-xs",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
