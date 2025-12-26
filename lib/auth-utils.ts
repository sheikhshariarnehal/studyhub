import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { createClient } from "@/lib/supabase"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
  is_approved: boolean
  department_id?: string | null
  batch_id?: string | null
  department?: { id: string; name: string; short_name: string } | null
  batch?: { id: string; batch_name: string; batch_number: number } | null
}

export interface ContentFilter {
  department_id: string | null
  batch_id: string | null
  excludeNullDeptBatch: boolean
}

// Helper function to get authenticated user from request
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // Check for student token first (auth-token), then admin token
  const token = request.cookies.get("auth-token")?.value || request.cookies.get("admin_token")?.value
  
  if (!token) {
    console.log("[getAuthUser] No auth token cookie found")
    return null
  }

  try {
    console.log("[getAuthUser] Verifying token with JWT_SECRET...")
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string }
    console.log("[getAuthUser] Token decoded, userId:", decoded.userId, "role:", decoded.role)
    const supabase = createClient()

    // Check if this is a student user
    if (decoded.role === "student") {
      const { data: student, error } = await supabase
        .from("students")
        .select(`
          id, 
          email, 
          full_name,
          department_id,
          batch_id
        `)
        .eq("id", decoded.userId)
        .single()

      if (error || !student) {
        console.log("[getAuthUser] Student query failed:", error)
        return null
      }

      // Fetch department and batch separately (only if IDs exist)
      let department = null
      let batch = null
      
      if (student.department_id) {
        const { data: dept } = await supabase
          .from("departments")
          .select("id, name, short_name")
          .eq("id", student.department_id)
          .single()
        department = dept
      }
      
      if (student.batch_id) {
        const { data: btch } = await supabase
          .from("batches")
          .select("id, batch_name, batch_number")
          .eq("id", student.batch_id)
          .single()
        batch = btch
      }

      console.log("[getAuthUser] Student found:", student.email, "Department:", department?.short_name, "Batch:", batch?.batch_number)
      return {
        id: student.id,
        email: student.email,
        full_name: student.full_name || '',
        role: "student",
        is_approved: true, // Students are auto-approved
        department_id: student.department_id,
        batch_id: student.batch_id,
        department: department || null,
        batch: batch || null,
      }
    }

    // Admin user lookup
    const { data: user, error } = await supabase
      .from("admin_users")
      .select(`
        id, 
        email, 
        full_name, 
        role, 
        is_approved,
        department_id,
        batch_id,
        departments:department_id (id, name, short_name),
        batches!admin_users_batch_id_fkey (id, batch_name, batch_number)
      `)
      .eq("id", decoded.userId)
      .single()

    if (error || !user) {
      console.log("[getAuthUser] Database query failed:", error)
      return null
    }

    console.log("[getAuthUser] User found:", user.email, user.role)
    // Transform the response to match AuthUser interface
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_approved: user.is_approved,
      department_id: user.department_id,
      batch_id: user.batch_id,
      department: user.departments as AuthUser['department'],
      batch: user.batches as AuthUser['batch'],
    }
  } catch (error) {
    console.log("[getAuthUser] Error:", error)
    return null
  }
}

// Check if user is admin or has elevated privileges
export function isAdmin(user: AuthUser): boolean {
  const adminRoles = ["super_admin", "admin", "moderator", "content_creator", "section_admin"]
  return adminRoles.includes(user.role)
}

// Check if user is a contributor (limited access)
export function isContributor(user: AuthUser): boolean {
  return user.role === "contributor"
}

// Check if user is a student (limited access)
export function isStudent(user: AuthUser): boolean {
  return user.role === "student"
}

// Check if user can access all content (not just their own)
export function canAccessAllContent(user: AuthUser): boolean {
  return isAdmin(user)
}

// Get content filter for a user based on their role and viewing context
export function getContentFilterForUser(
  user: AuthUser,
  viewDepartmentId?: string,
  viewBatchId?: string
): ContentFilter {
  // Admins can view all content, optionally filtered
  if (isAdmin(user)) {
    return {
      department_id: viewDepartmentId || null,
      batch_id: viewBatchId || null,
      excludeNullDeptBatch: false,
    }
  }

  // Students are restricted to their assigned department/batch
  if (isStudent(user)) {
    return {
      department_id: user.department_id || null,
      batch_id: user.batch_id || null,
      excludeNullDeptBatch: true, // Students only see content for their department/batch
    }
  }

  // Contributors are restricted to their assigned department/batch
  // But can view content within their department/batch scope
  if (isContributor(user)) {
    return {
      department_id: viewDepartmentId || user.department_id || null,
      batch_id: viewBatchId || user.batch_id || null,
      excludeNullDeptBatch: true, // Contributors only see content with department/batch assigned
    }
  }

  // Default: no filtering
  return {
    department_id: null,
    batch_id: null,
    excludeNullDeptBatch: false,
  }
}

// Check if user can manage (edit/delete) specific content
export function canManageContent(
  user: AuthUser,
  contentDepartmentId: string | null,
  contentBatchId: string | null
): boolean {
  // Admins can manage all content
  if (isAdmin(user)) {
    return true
  }

  // Contributors can only manage content in their department/batch
  if (isContributor(user)) {
    // Must have department and batch assigned
    if (!user.department_id || !user.batch_id) {
      return false
    }

    // Content must have department and batch
    if (!contentDepartmentId || !contentBatchId) {
      return false
    }

    // Must match user's department and batch
    return user.department_id === contentDepartmentId && user.batch_id === contentBatchId
  }

  return false
}
