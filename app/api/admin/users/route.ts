import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to verify admin access
async function verifyAdminAccess(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value
  
  if (!token) {
    return { authorized: false, error: "Unauthorized", userId: null, role: null }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    const adminRoles = ['super_admin', 'admin', 'moderator']
    
    if (!adminRoles.includes(decoded.role)) {
      return { authorized: false, error: "Insufficient permissions", userId: decoded.userId, role: decoded.role }
    }
    
    return { authorized: true, error: null, userId: decoded.userId, role: decoded.role }
  } catch {
    return { authorized: false, error: "Invalid token", userId: null, role: null }
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request)
    if (!auth.authorized) {
      console.error("Unauthorized access attempt:", auth.error)
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const isApproved = searchParams.get("is_approved")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    console.log("Fetching users with params:", { role, isApproved, search, page, limit })

    const supabase = createClient()

    // Build query - simplified without the batch join for now
    let query = supabase
      .from("admin_users")
      .select("*", { count: 'exact' })

    // Apply filters
    if (role && role !== "all") {
      query = query.eq("role", role)
    }
    
    if (isApproved !== null && isApproved !== "all") {
      query = query.eq("is_approved", isApproved === "true")
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data: users, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching admin users:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      )
    }

    console.log("Successfully fetched users:", users?.length || 0, "Total count:", count)

    // Fetch batch info separately for users that have batch_id
    if (users && users.length > 0) {
      const batchIds = users.filter(u => u.batch_id).map(u => u.batch_id)
      if (batchIds.length > 0) {
        const { data: batches } = await supabase
          .from("batches")
          .select("id, batch_number, batch_name")
          .in("id", batchIds)
        
        // Map batches to users
        const batchMap = new Map(batches?.map(b => [b.id, b]) || [])
        users.forEach(user => {
          if (user.batch_id) {
            user.batches = batchMap.get(user.batch_id) || null
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update user (approve, change role, etc.)
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const { userId, updates } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      )
    }

    // Only super_admin can change to admin roles
    const adminRoles = ['super_admin', 'admin', 'moderator']
    if (updates.role && adminRoles.includes(updates.role) && auth.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: "Only super admin can assign admin roles" },
        { status: 403 }
      )
    }

    const supabase = createClient()

    // Validate allowed update fields
    const allowedFields = ['is_approved', 'is_active', 'role', 'department', 'phone', 'batch_id', 'department_id']
    const sanitizedUpdates: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field]
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      )
    }

    sanitizedUpdates.updated_at = new Date().toISOString()

    console.log("Updating user:", userId, "with:", sanitizedUpdates)

    const { data: updatedUser, error } = await supabase
      .from("admin_users")
      .update(sanitizedUpdates)
      .eq("id", userId)
      .select("*")
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json(
        { success: false, error: "Failed to update user" },
        { status: 500 }
      )
    }

    console.log("User updated successfully:", updatedUser.id)

    // Fetch batch info separately if needed
    if (updatedUser.batch_id) {
      const { data: batch } = await supabase
        .from("batches")
        .select("id, batch_number, batch_name")
        .eq("id", updatedUser.batch_id)
        .single()
      
      if (batch) {
        updatedUser.batches = batch
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    // Only super_admin can delete users
    if (auth.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: "Only super admin can delete users" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (userId === auth.userId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", userId)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json(
        { success: false, error: "Failed to delete user" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    })

  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role, department, phone } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: "Email, password, and full name are required" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 12
    const password_hash = await bcrypt.hash(password, saltRounds)

    // Create user
    const { data: newUser, error } = await supabase
      .from("admin_users")
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        role: role || "admin",
        department,
        phone,
        is_active: true,
        login_count: 0
      })
      .select("id, email, full_name, role, department, phone, is_active, created_at, updated_at")
      .single()

    if (error) {
      console.error("Error creating admin user:", error)
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: newUser
    })

  } catch (error) {
    console.error("Create admin user error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
