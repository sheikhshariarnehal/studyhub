"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: "super_admin" | "admin" | "moderator" | "content_creator" | "section_admin" | "contributor" | "student"
  department?: string | any
  batch?: any
  department_id?: string
  batch_id?: string
  phone?: string
  student_id?: string
  is_active?: boolean
  is_approved?: boolean
  last_login?: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  studentLogin: (email: string, departmentId: string, batchId: string, fullName?: string) => Promise<{ success: boolean; error?: string }>
  updateStudentContext: (departmentId: string, batchId: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      console.log("🔍 Checking authentication...")
      
      // Add timeout for production
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
        cache: 'no-store', // Prevent caching
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      clearTimeout(timeoutId)

      console.log("📊 Auth check response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Auth check response data:", data)
        if (data.success) {
          console.log("✅ User authenticated:", data.user.email, "Role:", data.user.role)
          setUser(data.user)
        } else {
          console.log("❌ Auth check failed:", data.error)
          setUser(null)
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("❌ Auth check response not ok:", response.status)
        }
        setUser(null)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("❌ Auth check timeout")
      } else {
        console.error("❌ Auth check error:", error)
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log("🔍 AuthContext login for:", email)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: 'no-store', // Prevent caching
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("📊 AuthContext login response:", data)

      if (data.success) {
        console.log("✅ AuthContext login successful")
        setUser(data.user)
        // Force page reload to clear any cached state
        await checkAuth()
        return { success: true }
      } else {
        console.log("❌ AuthContext login failed:", data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("❌ AuthContext login error:", error)
      return { success: false, error: "Network error occurred" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
    }
  }

  const studentLogin = async (email: string, departmentId: string, batchId: string, fullName?: string) => {
    try {
      console.log("🔍 AuthContext student login for:", email)
      const response = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: 'no-store',
        body: JSON.stringify({ email, department_id: departmentId, batch_id: batchId, full_name: fullName }),
      })

      const data = await response.json()
      console.log("📊 AuthContext student login response:", data)

      if (data.success) {
        console.log("✅ AuthContext student login successful, user:", data.user)
        console.log("✅ Cookie should be set, ready for redirect")
        setUser(data.user)
        return { success: true }
      } else {
        console.log("❌ AuthContext student login failed:", data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("❌ AuthContext student login error:", error)
      return { success: false, error: "Network error occurred" }
    }
  }

  const updateStudentContext = async (departmentId: string, batchId: string) => {
    if (!user || user.role !== "student") {
      return { success: false, error: "Not a student user" }
    }

    try {
      const response = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: 'no-store',
        body: JSON.stringify({ 
          email: user.email, 
          department_id: departmentId, 
          batch_id: batchId,
          full_name: user.full_name
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("❌ Update student context error:", error)
      return { success: false, error: "Network error occurred" }
    }
  }

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🚀 AuthContext mounted, checking auth...")
    }
    checkAuth()
  }, [])

  const value = {
    user,
    loading,
    login,
    studentLogin,
    updateStudentContext,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
