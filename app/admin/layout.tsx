"use client"

// Force dynamic rendering for admin routes - prevent caching
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { AnalyticsWrapper } from "@/components/analytics-wrapper"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    // Show timeout message if loading takes too long
    const timer = setTimeout(() => {
      if (loading) {
        setShowTimeout(true)
      }
    }, 8000)

    return () => clearTimeout(timer)
  }, [loading])

  // If on login page, just render children without auth check
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <div>
            <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
            {showTimeout && (
              <Alert className="mt-4 max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Taking longer than expected</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>This might indicate a connection issue. Try:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Checking your internet connection</li>
                    <li>Refreshing the page</li>
                    <li>Clearing your browser cache</li>
                  </ul>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => window.location.reload()} size="sm">
                      Refresh Page
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/diagnostics">Run Diagnostics</Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    // Show loading state while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AnalyticsWrapper user={user}>
        <AdminSidebar user={user} />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <AdminHeader user={user} />
          <main className="flex-1 p-6 pt-4">{children}</main>
        </div>
      </AnalyticsWrapper>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AuthProvider>
    </ThemeProvider>
  )
}
