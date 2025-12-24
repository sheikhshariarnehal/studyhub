"use client"

import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Loader2, AlertCircle, Clock, User } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

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

  // Check if user is unapproved contributor trying to access restricted pages
  const isUnapprovedContributor = user.role === 'contributor' && !user.is_approved
  const allowedPaths = ['/dashboard', '/dashboard/profile']
  const isAllowedPath = allowedPaths.some(path => pathname === path || pathname.startsWith('/dashboard/profile'))

  // Show restricted access message for unapproved contributors on non-allowed pages
  if (isUnapprovedContributor && !isAllowedPath) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background">
          <DashboardSidebar user={user} />
          <div className="lg:pl-64 flex flex-col min-h-screen">
            <DashboardHeader user={user} />
            <main className="flex-1 p-4 lg:p-6 bg-background">
              <div className="max-w-2xl mx-auto mt-8">
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-xl text-amber-800 dark:text-amber-200">
                      Account Pending Approval
                    </CardTitle>
                    <CardDescription className="text-amber-700 dark:text-amber-300">
                      Your account is awaiting admin approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Thank you for signing up! Your account is currently being reviewed by our admin team. 
                      Once approved, you&apos;ll have full access to all contributor features.
                    </p>
                    <div className="bg-background/80 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium">While waiting, you can:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Complete your profile information</li>
                        <li>✓ Add your department and section</li>
                        <li>✓ Upload your profile picture</li>
                        <li>✓ Add your social links</li>
                      </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                      <Button asChild>
                        <Link href="/dashboard/profile">
                          <User className="w-4 h-4 mr-2" />
                          Complete Profile
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/dashboard">
                          Back to Dashboard
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <DashboardSidebar user={user} />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <DashboardHeader user={user} />
          <main className="flex-1 p-4 lg:p-6 bg-background">{children}</main>
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
