"use client"

import { useEffect, useRef, useCallback } from "react"
import { track } from "@vercel/analytics"
import { usePathname } from "next/navigation"

interface StudentAnalyticsUser {
  id: string
  role?: string
}

/**
 * Hook to track authenticated student activity via Vercel Analytics.
 * Only fires events when user is authenticated.
 * 
 * Events tracked:
 * - student_login: Fired once on successful login
 * - student_active: Fired on each authenticated page view
 */
export function useStudentAnalytics(user: StudentAnalyticsUser | null) {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)
  const hasTrackedLogin = useRef(false)

  // Track page views for authenticated users
  useEffect(() => {
    if (!user?.id) {
      // Reset tracking state when user logs out
      lastTrackedPath.current = null
      hasTrackedLogin.current = false
      return
    }

    // Prevent duplicate tracking for the same path
    if (lastTrackedPath.current === pathname) {
      return
    }

    lastTrackedPath.current = pathname

    // Track student_active event on every authenticated page load
    track("student_active", {
      user_id: user.id,
      page_path: pathname,
      timestamp: new Date().toISOString(),
    })
  }, [user?.id, pathname])

  return null
}

/**
 * Track student login event - call this after successful login
 */
export function trackStudentLogin(userId: string, role: string = "student") {
  track("student_login", {
    user_id: userId,
    role: role,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track custom student events
 */
export function trackStudentEvent(
  eventName: string,
  userId: string,
  properties?: Record<string, string | number | boolean>
) {
  if (!userId) return

  track(eventName, {
    user_id: userId,
    ...properties,
    timestamp: new Date().toISOString(),
  })
}
