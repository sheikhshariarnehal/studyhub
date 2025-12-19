"use client"

import React, { createContext, useContext, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { track } from "@vercel/analytics"

interface StudentUser {
  id: string
  role?: string
  email?: string
}

interface StudentAnalyticsContextType {
  trackLogin: (user: StudentUser) => void
  trackEvent: (eventName: string, properties?: Record<string, string | number | boolean>) => void
}

const StudentAnalyticsContext = createContext<StudentAnalyticsContextType | undefined>(undefined)

interface StudentAnalyticsProviderProps {
  children: React.ReactNode
  user: StudentUser | null
}

/**
 * Analytics Provider that tracks authenticated student activity.
 * 
 * Features:
 * - Tracks "student_active" event on every authenticated page view
 * - Provides trackLogin() for login events
 * - Provides trackEvent() for custom events
 * - Only fires events when user is authenticated (user.id exists)
 * 
 * Usage:
 * ```tsx
 * <StudentAnalyticsProvider user={authenticatedUser}>
 *   <YourApp />
 * </StudentAnalyticsProvider>
 * ```
 */
export function StudentAnalyticsProvider({ children, user }: StudentAnalyticsProviderProps) {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)
  const userId = user?.id

  // Track page views for authenticated users only
  useEffect(() => {
    if (!userId) {
      // Reset tracking state when user logs out
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
      timestamp: new Date().toISOString(),
    })
  }, [userId, pathname])

  // Track login event - should be called after successful login
  const trackLogin = (loginUser: StudentUser) => {
    if (!loginUser?.id) return

    track("student_login", {
      user_id: loginUser.id,
      role: loginUser.role || "student",
      timestamp: new Date().toISOString(),
    })
  }

  // Track custom events with user context
  const trackEvent = (
    eventName: string,
    properties?: Record<string, string | number | boolean>
  ) => {
    if (!userId) return

    track(eventName, {
      user_id: userId,
      ...properties,
      timestamp: new Date().toISOString(),
    })
  }

  const contextValue: StudentAnalyticsContextType = {
    trackLogin,
    trackEvent,
  }

  return (
    <StudentAnalyticsContext.Provider value={contextValue}>
      {children}
    </StudentAnalyticsContext.Provider>
  )
}

/**
 * Hook to access student analytics functions.
 * Must be used within a StudentAnalyticsProvider.
 */
export function useStudentAnalyticsContext() {
  const context = useContext(StudentAnalyticsContext)
  if (context === undefined) {
    throw new Error("useStudentAnalyticsContext must be used within a StudentAnalyticsProvider")
  }
  return context
}

/**
 * Standalone function to track student login.
 * Can be used outside of React components.
 */
export function trackStudentLogin(userId: string, role: string = "student") {
  if (!userId) return

  track("student_login", {
    user_id: userId,
    role: role,
    timestamp: new Date().toISOString(),
  })
}
