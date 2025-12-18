"use client"

import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url?: string
  is_approved: boolean
  batch_id?: string
  batches?: {
    batch_name: string
    batch_number: number
  }
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include",
          cache: "no-store",
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUser(data.user)
          } else {
            router.push("/login")
          }
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowTimeout(true)
      }
    }, 8000)

    return () => clearTimeout(timer)
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
            {showTimeout && (
              <Alert className="mt-4 max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Taking longer than expected</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>This might indicate a connection issue.</p>
                  <Button onClick={() => window.location.reload()} size="sm">
                    Refresh Page
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <DashboardSidebar user={user} />
        <div className="lg:pl-64">
          <DashboardHeader user={user} />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>
}
