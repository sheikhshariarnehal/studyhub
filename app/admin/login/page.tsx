"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Admin Login Page
 * 
 * This page now redirects to the unified /login page to avoid 
 * having multiple login interfaces.
 */
export default function AdminLoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main login page to avoid conflict
    // We use replace to avoid adding this page to the history stack
    router.replace("/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Redirecting</h1>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we take you to the login page...</p>
        </div>
      </div>
    </div>
  )
}
