"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { track } from "@vercel/analytics"

/**
 * Global Analytics Component
 * 
 * Tracks authenticated user activity across ALL pages by checking for
 * authentication session in cookies or local storage.
 * 
 * This component:
 * - Runs on every page in the app (integrated in root layout)
 * - Checks for authenticated user (from API or session)
 * - Tracks "student_active" events for authenticated users only
 * - Prevents duplicate tracking on same page
 * 
 * Note: Login tracking happens in auth-context.tsx
 */
export function GlobalAnalytics() {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    // Function to check if user is authenticated and track activity
    const checkAuthAndTrack = async () => {
      try {
        // Check if user is authenticated via API
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.success && data.user?.id) {
            const userId = data.user.id
            const userRole = data.user.role || "student"

            // Prevent duplicate tracking for same user on same path
            if (lastTrackedPath.current === pathname && lastUserId.current === userId) {
              return
            }

            lastTrackedPath.current = pathname
            lastUserId.current = userId

            // Track student_active event
            track("student_active", {
              user_id: userId,
              page_path: pathname,
              role: userRole,
            })
          } else {
            // User not authenticated, reset tracking state
            lastTrackedPath.current = null
            lastUserId.current = null
          }
        }
      } catch (error) {
        // Silently fail - don't track if API is unavailable
        // This prevents errors from blocking page rendering
      }
    }

    // Only track on client-side
    if (typeof window !== "undefined") {
      checkAuthAndTrack()
    }
  }, [pathname])

  // This component doesn't render anything
  return null
}
