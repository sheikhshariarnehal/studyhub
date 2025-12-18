"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff, UserPlus, Check, ChevronDown } from "lucide-react"

interface Batch {
  id: string
  batch_number: number
  batch_name: string
  start_year: number | null
  end_year: number | null
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
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingBatches, setIsFetchingBatches] = useState(true)

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
      } catch (error) {
        console.error("Error fetching batches:", error)
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
          }
        }
      } catch {
        // User not logged in, stay on signup page
      }
    }
    checkAuth()
  }, [router])

  const selectedBatch = batches.find((b) => b.id === selectedBatchId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Validation
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    // Must select a batch or enter a custom one
    if (!selectedBatchId && !newBatchNumber) {
      setError("Please select your batch or enter a custom batch number")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/login?registered=true")
        }, 2000)
      } else {
        setError(data.error || "Signup failed")
      }
    } catch (error) {
      console.error("Signup error:", error)
      setError("Network error occurred. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-green-600 p-3 rounded-full">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join DIU Learning</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl text-center font-semibold">Sign Up</h2>
            <p className="text-center text-gray-600">
              Fill in your details to create an account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span>{success}</span>
                </div>
                <p className="text-sm mt-1">Redirecting to login...</p>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student ID <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="studentId"
                type="text"
                placeholder="e.g., 221-15-XXXX"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Batch Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Batch <span className="text-red-500">*</span>
              </label>
              
              {!showCustomBatch ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                    disabled={isLoading || isFetchingBatches}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-left flex items-center justify-between bg-white"
                  >
                    <span className={selectedBatch ? "text-gray-900" : "text-gray-500"}>
                      {isFetchingBatches 
                        ? "Loading batches..." 
                        : selectedBatch 
                          ? selectedBatch.batch_name 
                          : "Select your batch"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  {showBatchDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {batches.map((batch) => (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() => {
                            setSelectedBatchId(batch.id)
                            setShowBatchDropdown(false)
                            setNewBatchNumber("")
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                            selectedBatchId === batch.id ? "bg-green-50 text-green-700" : ""
                          }`}
                        >
                          {batch.batch_name}
                          {batch.start_year && batch.end_year && (
                            <span className="text-gray-500 text-sm ml-2">
                              ({batch.start_year}-{batch.end_year})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  placeholder="Enter batch number (e.g., 76)"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  disabled={isLoading}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
              
              <button
                type="button"
                onClick={() => {
                  setShowCustomBatch(!showCustomBatch)
                  setSelectedBatchId("")
                  setNewBatchNumber("")
                }}
                className="text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                {showCustomBatch 
                  ? "← Select from existing batches" 
                  : "Batch not listed? Enter manually"}
              </button>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              disabled={isLoading || !!success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>© 2024 DIU Learning Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
