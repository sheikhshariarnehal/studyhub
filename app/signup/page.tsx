"use client"

import { useState, useCallback, useEffect, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff, UserPlus, Check, ChevronDown, GraduationCap, Mail, Lock, User, IdCard, Users, Sparkles, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Batch {
  id: string
  batch_number: number
  batch_name: string
  start_year: number | null
  end_year: number | null
}

// Password strength indicator component
function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }, [password])

  const strengthConfig = useMemo(() => {
    if (strength <= 1) return { label: "Weak", color: "bg-destructive", width: "w-1/5" }
    if (strength === 2) return { label: "Fair", color: "bg-orange-500", width: "w-2/5" }
    if (strength === 3) return { label: "Good", color: "bg-yellow-500", width: "w-3/5" }
    if (strength === 4) return { label: "Strong", color: "bg-green-500", width: "w-4/5" }
    return { label: "Very Strong", color: "bg-green-600", width: "w-full" }
  }, [strength])

  if (!password) return null

  return (
    <div className="space-y-1.5 animate-in fade-in duration-200">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className={cn(
          "font-medium",
          strength <= 1 && "text-destructive",
          strength === 2 && "text-orange-500",
          strength === 3 && "text-yellow-600",
          strength >= 4 && "text-green-600"
        )}>{strengthConfig.label}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-300 rounded-full", strengthConfig.color, strengthConfig.width)} />
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [studentId, setStudentId] = useState("")
  const [selectedBatchId, setSelectedBatchId] = useState("")
  const [newBatchNumber, setNewBatchNumber] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)
  const [showCustomBatch, setShowCustomBatch] = useState(false)
  const [batches, setBatches] = useState<Batch[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isFetchingBatches, setIsFetchingBatches] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const router = useRouter()

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch("/api/batches")
        const data = await response.json()
        if (data.success) {
          setBatches(data.batches)
        }
      } catch {
        console.error("Error fetching batches")
      } finally {
        setIsFetchingBatches(false)
      }
    }
    fetchBatches()
  }, [])

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            window.location.href = "/admin"
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

  const selectedBatch = useMemo(() => batches.find((b) => b.id === selectedBatchId), [batches, selectedBatchId])

  // Validation states
  const validation = useMemo(() => ({
    email: email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : null,
    password: password ? password.length >= 6 : null,
    confirmPassword: confirmPassword ? password === confirmPassword : null,
    fullName: fullName ? fullName.trim().length >= 2 : null,
    batch: selectedBatchId || newBatchNumber ? true : null,
  }), [email, password, confirmPassword, fullName, selectedBatchId, newBatchNumber])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields")
      return
    }

    if (!validation.email) {
      setError("Please enter a valid email address")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (!selectedBatchId && !newBatchNumber) {
      setError("Please select your batch or enter a custom batch number")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password,
            studentId: studentId || null,
            batchId: selectedBatchId || null,
            newBatchNumber: showCustomBatch ? newBatchNumber : null,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setSuccess(data.message)
          // Clear form
          setFullName("")
          setEmail("")
          setPassword("")
          setConfirmPassword("")
          setStudentId("")
          setSelectedBatchId("")
          setNewBatchNumber("")

          // Redirect to login after 2 seconds
          setTimeout(() => {
            router.push("/login?registered=true")
          }, 2000)
        } else {
          setError(data.error || "Signup failed")
        }
      } catch {
        setError("Network error occurred. Please try again.")
      }
    })
  }, [fullName, email, password, confirmPassword, studentId, selectedBatchId, newBatchNumber, showCustomBatch, validation.email, router])

  const togglePassword = useCallback(() => setShowPassword(prev => !prev), [])
  const toggleConfirmPassword = useCallback(() => setShowConfirmPassword(prev => !prev), [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowBatchDropdown(false)
    if (showBatchDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showBatchDropdown])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-green-500/5">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-green-500/20 border-t-green-500 animate-spin" />
            <UserPlus className="h-5 w-5 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-green-500/5 p-4 py-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-500/40 rounded-full animate-ping" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-green-500/30 rounded-full animate-ping delay-500" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-green-500/40 rounded-full animate-ping delay-700" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <Sparkles className="h-4 w-4 text-green-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Join DIU Learning</h1>
            <p className="text-muted-foreground">Create your account to get started</p>
          </div>
        </div>

        {/* Signup Card */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Fill in your details to join the platform
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

              {/* Success Alert */}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">{success}</span>
                  </div>
                  <p className="text-xs mt-1 opacity-80">Redirecting to login...</p>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-1">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === 'fullName' ? "text-green-500" : "text-muted-foreground"
                  )} />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending || !!success}
                    required
                    className={cn(
                      "pl-10 h-11 transition-all duration-200",
                      validation.fullName === true && "border-green-500/50 focus:ring-green-500/20",
                      validation.fullName === false && "border-destructive/50 focus:ring-destructive/20"
                    )}
                    autoComplete="name"
                  />
                  {validation.fullName === true && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === 'email' ? "text-green-500" : "text-muted-foreground"
                  )} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending || !!success}
                    required
                    className={cn(
                      "pl-10 h-11 transition-all duration-200",
                      validation.email === true && "border-green-500/50 focus:ring-green-500/20",
                      validation.email === false && "border-destructive/50 focus:ring-destructive/20"
                    )}
                    autoComplete="email"
                  />
                  {validation.email === true && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              {/* Student ID */}
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium flex items-center gap-1">
                  Student ID <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <div className="relative">
                  <IdCard className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === 'studentId' ? "text-green-500" : "text-muted-foreground"
                  )} />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="e.g., 221-15-XXXX"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    onFocus={() => setFocusedField('studentId')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending || !!success}
                    className="pl-10 h-11 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Batch Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  Batch <span className="text-destructive">*</span>
                </Label>

                {!showCustomBatch ? (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <Users className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 z-10",
                      showBatchDropdown ? "text-green-500" : "text-muted-foreground"
                    )} />
                    <button
                      type="button"
                      onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                      disabled={isPending || isFetchingBatches || !!success}
                      className={cn(
                        "w-full pl-10 pr-10 h-11 border rounded-md text-left flex items-center justify-between bg-background transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        selectedBatch && "border-green-500/50"
                      )}
                    >
                      <span className={selectedBatch ? "text-foreground" : "text-muted-foreground"}>
                        {isFetchingBatches
                          ? "Loading batches..."
                          : selectedBatch
                            ? selectedBatch.batch_name
                            : "Select your batch"}
                      </span>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200 absolute right-3",
                        showBatchDropdown && "rotate-180"
                      )} />
                    </button>

                    {showBatchDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {batches.length === 0 ? (
                          <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                            No batches available
                          </div>
                        ) : (
                          batches.map((batch) => (
                            <button
                              key={batch.id}
                              type="button"
                              onClick={() => {
                                setSelectedBatchId(batch.id)
                                setShowBatchDropdown(false)
                                setNewBatchNumber("")
                              }}
                              className={cn(
                                "w-full px-3 py-2.5 text-left hover:bg-accent transition-colors flex items-center justify-between",
                                selectedBatchId === batch.id && "bg-green-500/10 text-green-600 dark:text-green-400"
                              )}
                            >
                              <span>{batch.batch_name}</span>
                              {batch.start_year && batch.end_year && (
                                <span className="text-muted-foreground text-xs">
                                  {batch.start_year}-{batch.end_year}
                                </span>
                              )}
                              {selectedBatchId === batch.id && (
                                <Check className="h-4 w-4 ml-2" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Users className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                      focusedField === 'batch' ? "text-green-500" : "text-muted-foreground"
                    )} />
                    <Input
                      type="number"
                      placeholder="Enter batch number (e.g., 76)"
                      value={newBatchNumber}
                      onChange={(e) => setNewBatchNumber(e.target.value)}
                      onFocus={() => setFocusedField('batch')}
                      onBlur={() => setFocusedField(null)}
                      disabled={isPending || !!success}
                      min="1"
                      className="pl-10 h-11"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowCustomBatch(!showCustomBatch)
                    setSelectedBatchId("")
                    setNewBatchNumber("")
                  }}
                  disabled={isPending || !!success}
                  className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:underline transition-colors"
                >
                  {showCustomBatch
                    ? "← Select from existing batches"
                    : "Batch not listed? Enter manually"}
                </button>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === 'password' ? "text-green-500" : "text-muted-foreground"
                  )} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending || !!success}
                    required
                    minLength={6}
                    className="pl-10 pr-10 h-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={togglePassword}
                    disabled={isPending || !!success}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-1">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === 'confirmPassword' ? "text-green-500" : "text-muted-foreground"
                  )} />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending || !!success}
                    required
                    className={cn(
                      "pl-10 pr-10 h-11",
                      validation.confirmPassword === true && "border-green-500/50",
                      validation.confirmPassword === false && "border-destructive/50"
                    )}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={toggleConfirmPassword}
                    disabled={isPending || !!success}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={cn(
                    "text-xs flex items-center gap-1 animate-in fade-in duration-200",
                    validation.confirmPassword ? "text-green-600 dark:text-green-400" : "text-destructive"
                  )}>
                    {validation.confirmPassword ? (
                      <><Check className="h-3 w-3" /> Passwords match</>
                    ) : (
                      <><X className="h-3 w-3" /> Passwords do not match</>
                    )}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium bg-green-600 hover:bg-green-700 group"
                disabled={isPending || !!success}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
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
                <span className="bg-card px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full h-10 group">
                Sign In
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
