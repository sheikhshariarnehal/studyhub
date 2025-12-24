"use client"

import { useState, useCallback, useEffect, useTransition } from "react"
import Link from "next/link"
import { Loader2, Eye, EyeOff, GraduationCap, Mail, Lock, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            const adminRoles = ['super_admin', 'admin', 'moderator', 'content_creator', 'section_admin']
            const redirectUrl = adminRoles.includes(data.user.role) ? "/admin" : "/dashboard"
            window.location.href = redirectUrl
            return
          }
        }
      } catch {
        // User not logged in
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (data.success) {
          const redirectUrl = data.redirectUrl || "/admin"
          await new Promise(resolve => setTimeout(resolve, 300))
          window.location.replace(redirectUrl)
        } else {
          if (data.needsApproval) {
            // Special handling for pending approval
            setError(data.error || "Your account is pending approval")
          } else {
            setError(data.error || "Invalid credentials")
          }
        }
      } catch {
        setError("Network error. Please try again.")
      }
    })
  }, [email, password])

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <GraduationCap className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground animate-pulse">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-ping" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary/30 rounded-full animate-ping delay-500" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/40 rounded-full animate-ping delay-700" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <GraduationCap className="h-10 w-10 text-primary-foreground" />
              </div>
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">DIU Learning Platform</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  {error}
                </div>
              )}
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === 'email' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending}
                    required
                    className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    autoComplete="email"
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === 'password' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending}
                    required
                    className="pl-10 pr-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={togglePassword}
                    disabled={isPending}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium group relative overflow-hidden"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">New to DIU Learning?</span>
              </div>
            </div>
            
            <Link href="/signup" className="w-full">
              <Button variant="outline" className="w-full h-10 group">
                Create an Account
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground animate-in fade-in duration-500 delay-300">
          © {new Date().getFullYear()} DIU Learning Platform. All rights reserved.
        </p>
      </div>
    </div>
  )
}
