"use client"

import { useState, useCallback, useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, GraduationCap, Mail, Lock, ArrowRight, Sparkles, User, Users, Building2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface Department {
  id: string
  name: string
  short_name: string
}

interface Batch {
  id: string
  batch_number: number
  batch_name: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login: adminLogin, studentLogin } = useAuth()
  
  // Admin login state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Student login state
  const [studentEmail, setStudentEmail] = useState("")
  const [studentName, setStudentName] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"admin" | "student">("student")

  // Fetch departments and batches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, batchRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/batches")
        ])

        if (deptRes.ok) {
          const deptData = await deptRes.json()
          if (deptData.success) {
            setDepartments(deptData.departments)
          }
        }

        if (batchRes.ok) {
          const batchData = await batchRes.json()
          if (batchData.success) {
            setBatches(batchData.batches)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
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
        console.log("🔐 Attempting admin login...")
        const result = await adminLogin(email, password)

        if (result.success) {
          console.log("✅ Admin login successful, checking role...")
          const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
          })
          const data = await response.json()
          const adminRoles = ['super_admin', 'admin', 'moderator', 'content_creator', 'section_admin']
          const defaultUrl = adminRoles.includes(data.user?.role) ? "/admin" : "/"
          
          // Check if there's a return URL saved
          const returnUrl = sessionStorage.getItem('returnUrl')
          const redirectUrl = returnUrl || defaultUrl
          if (returnUrl) {
            sessionStorage.removeItem('returnUrl')
          }
          
          console.log("📍 Redirecting to:", redirectUrl)
          // Use window.location for hard redirect to ensure clean state
          window.location.href = redirectUrl
        } else {
          console.error("❌ Admin login failed:", result.error)
          setError(result.error || "Invalid credentials")
        }
      } catch (error) {
        console.error("❌ Admin login error:", error)
        setError("Network error. Please try again.")
      }
    })
  }, [email, password, adminLogin])

  const handleStudentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (process.env.NODE_ENV === 'development') {
      console.log("📝 Form submitted with:", {
        studentEmail,
        selectedDepartment,
        selectedBatch,
        studentName
      })
    }

    if (!studentEmail || !selectedDepartment || !selectedBatch) {
      if (process.env.NODE_ENV === 'development') {
        console.error("❌ Validation failed - missing required fields")
      }
      setError("Please fill in all required fields")
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Validation passed, starting login...")
    }
    
    startTransition(async () => {
      try {
        console.log("🔐 Attempting student login...")
        const result = await studentLogin(
          studentEmail,
          selectedDepartment,
          selectedBatch,
          studentName || undefined
        )
        
        console.log("📊 Student login result:", result)

        if (result.success) {
          console.log("✅ Student login successful, redirecting...")
          // Wait a moment to ensure cookie is set
          await new Promise(resolve => setTimeout(resolve, 500))
          // Check if there's a return URL saved
          const returnUrl = sessionStorage.getItem('returnUrl')
          if (returnUrl) {
            sessionStorage.removeItem('returnUrl')
            window.location.href = returnUrl
          } else {
            // Use window.location for hard redirect to ensure clean state
            window.location.href = "/"
          }
        } else {
          console.error("❌ Student login failed:", result.error)
          setError(result.error || "Login failed")
        }
      } catch (error) {
        console.error("❌ Student login error:", error)
        setError("Network error. Please try again.")
      }
    })
  }, [studentEmail, studentName, selectedDepartment, selectedBatch, studentLogin])

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

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

        {/* Login Card with Tabs */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Choose how you want to access the platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "admin" | "student"); setError("") }} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>

              {/* Student Login Tab */}
              <TabsContent value="student" className="space-y-4">
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="student-email" className="text-sm font-medium">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative group">
                      <Mail className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                        focusedField === 'student-email' ? "text-primary" : "text-muted-foreground"
                      )} />
                      <Input
                        id="student-email"
                        type="email"
                        placeholder="you@example.com"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        onFocus={() => setFocusedField('student-email')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isPending}
                        required
                        className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-name" className="text-sm font-medium">
                      Full Name <span className="text-muted-foreground text-xs">(Optional)</span>
                    </Label>
                    <div className="relative group">
                      <User className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                        focusedField === 'student-name' ? "text-primary" : "text-muted-foreground"
                      )} />
                      <Input
                        id="student-name"
                        type="text"
                        placeholder="Your Name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        onFocus={() => setFocusedField('student-name')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isPending}
                        className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={isPending} required>
                      <SelectTrigger id="department" className="h-11">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select your department" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} {dept.short_name && `(${dept.short_name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch" className="text-sm font-medium">
                      Batch <span className="text-destructive">*</span>
                    </Label>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={isPending} required>
                      <SelectTrigger id="batch" className="h-11">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select your batch" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batch_name} (Batch {batch.batch_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                        Continue as Student
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    No password required. Just select your department and batch.
                  </p>
                </form>
              </TabsContent>

              {/* Admin Login Tab */}
              <TabsContent value="admin" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      {error}
                    </div>
                  )}
                  
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
                        placeholder="admin@example.com"
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
                        Sign In as Admin
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            {activeTab === "admin" && (
              <>
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
              </>
            )}
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
