import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { email, password, full_name, role, department, phone, is_active } = await request.json()
    const { id: userId } = await params

    if (!email || !full_name) {
      return NextResponse.json(
        { success: false, error: "Email and full name are required" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, email")
      .eq("id", userId)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Check if email is already taken by another user
    if (email.toLowerCase() !== existingUser.email) {
      const { data: emailCheck } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", email.toLowerCase())
        .neq("id", userId)
        .single()

      if (emailCheck) {
        return NextResponse.json(
          { success: false, error: "Email is already taken by another user" },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      email: email.toLowerCase(),
      full_name,
      role: role || "admin",
      department,
      phone,
      is_active: is_active !== undefined ? is_active : true,
      updated_at: new Date().toISOString()
    }

    // Hash new password if provided
    if (password && password.trim() !== "") {
      const saltRounds = 12
      updateData.password_hash = await bcrypt.hash(password, saltRounds)
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from("admin_users")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, full_name, role, department, phone, is_active, last_login, login_count, created_at, updated_at")
      .single()

    if (error) {
      console.error("Error updating admin user:", error)
      return NextResponse.json(
        { success: false, error: "Failed to update user" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error("Update admin user error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const supabase = createClient()

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, email")
      .eq("id", userId)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Delete user sessions first
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("user_id", userId)

    // Delete user
    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", userId)

    if (error) {
      console.error("Error deleting admin user:", error)
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
    console.error("Delete admin user error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
