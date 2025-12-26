import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/student/profile
 * Get current student profile
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const decoded: any = jwt.verify(token, JWT_SECRET)

    if (decoded.role !== "student") {
      return NextResponse.json(
        { success: false, error: "Not a student user" },
        { status: 403 }
      )
    }

    const supabase = createClient()

    const { data: student, error } = await supabase
      .from("students")
      .select(`
        *,
        departments:department_id (id, name, short_name),
        batches:batch_id (id, batch_name, batch_number)
      `)
      .eq("id", decoded.userId)
      .single()

    if (error || !student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: student
    })
  } catch (error) {
    console.error("Get student profile error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/student/profile
 * Update student profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const decoded: any = jwt.verify(token, JWT_SECRET)

    if (decoded.role !== "student") {
      return NextResponse.json(
        { success: false, error: "Not a student user" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { full_name, phone, student_id, department_id, batch_id } = body

    const supabase = createClient()

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) updateData.full_name = full_name
    if (phone !== undefined) updateData.phone = phone
    if (student_id !== undefined) updateData.student_id = student_id
    if (department_id !== undefined) updateData.department_id = department_id
    if (batch_id !== undefined) updateData.batch_id = batch_id

    const { data: updatedStudent, error } = await supabase
      .from("students")
      .update(updateData)
      .eq("id", decoded.userId)
      .select(`
        *,
        departments:department_id (id, name, short_name),
        batches:batch_id (id, batch_name, batch_number)
      `)
      .single()

    if (error) {
      console.error("Update student profile error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 }
      )
    }

    // Update JWT token if department or batch changed
    if (department_id !== undefined || batch_id !== undefined) {
      const newToken = jwt.sign(
        {
          userId: updatedStudent.id,
          email: updatedStudent.email,
          role: "student",
          department_id: updatedStudent.department_id,
          batch_id: updatedStudent.batch_id,
          sub: updatedStudent.id,
          user: updatedStudent.email
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      )

      const response = NextResponse.json({
        success: true,
        profile: updatedStudent
      })

      response.cookies.set("auth-token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })

      return response
    }

    return NextResponse.json({
      success: true,
      profile: updatedStudent
    })
  } catch (error) {
    console.error("Update student profile error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
