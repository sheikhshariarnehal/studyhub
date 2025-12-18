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
}

// Helper function to get authenticated user from request
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get("admin_token")?.value
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const supabase = createClient()

    const { data: user, error } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, is_approved")
      .eq("id", decoded.userId)
      .single()

    if (error || !user) {
      return null
    }

    return user as AuthUser
  } catch {
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

// Check if user can access all content (not just their own)
export function canAccessAllContent(user: AuthUser): boolean {
  return isAdmin(user)
}
