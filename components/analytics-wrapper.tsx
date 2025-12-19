"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { track } from "@vercel/analytics"

interface AuthenticatedUser {
  id: string
  role?: string
}

interface AnalyticsWrapperProps {
  children: React.ReactNode
  user: AuthenticatedUser | null
}

/**
 * Client-side analytics wrapper that tracks authenticated user activity.
 * 
 * This component should wrap authenticated pages/layouts and receives
 * the user object from the authentication context.
 * 
 * Events tracked:
 * - student_active: Fired on every authenticated page view
 * 
 * Note: student_login is tracked separately in auth-context.tsx
 */
export function AnalyticsWrapper({ children, user }: AnalyticsWrapperProps) {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)
  const userId = user?.id

  useEffect(() => {
    // Only track for authenticated users
    if (!userId) {
      lastTrackedPath.current = null
      return
    }

    // Prevent duplicate tracking for the same path
    if (lastTrackedPath.current === pathname) {
      return
    }

    lastTrackedPath.current = pathname

    // Track student_active event
    track("student_active", {
      user_id: userId,
      page_path: pathname,
      role: user?.role || "student",
    })
  }, [userId, pathname, user?.role])

  return <>{children}</>
}
