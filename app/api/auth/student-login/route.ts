import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Disable caching for this route - critical for auth
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/auth/student-login
 * Student login without password - only email, department, and batch required
 * Creates student account if doesn't exist, updates if exists
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, department_id, batch_id, full_name } = body

    if (!email || !department_id || !batch_id) {
      return NextResponse.json(
        { success: false, error: "Email, department, and batch are required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const supabase = createClient()

    // Check if student exists
    const { data: existingStudent, error: findError } = await supabase
      .from("students")
      .select("*")
      .eq("email", normalizedEmail)
      .single()

    let student

    if (existingStudent) {
      // Update existing student's department and batch
      const { data: updatedStudent, error: updateError } = await supabase
        .from("students")
        .update({
          department_id,
          batch_id,
          full_name: full_name || existingStudent.full_name,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingStudent.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating student:", updateError)
        return NextResponse.json(
          { success: false, error: "Failed to update student profile" },
          { status: 500 }
        )
      }

      student = updatedStudent
    } else {
      // Create new student
      const { data: newStudent, error: createError } = await supabase
        .from("students")
        .insert({
          email: normalizedEmail,
          full_name: full_name || null,
          department_id,
          batch_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating student:", createError)
        return NextResponse.json(
          { success: false, error: "Failed to create student account" },
          { status: 500 }
        )
      }

      student = newStudent
    }

    // Fetch department and batch names for the response
    const { data: department } = await supabase
      .from("departments")
      .select("id, name, short_name")
      .eq("id", department_id)
      .single()

    const { data: batch } = await supabase
      .from("batches")
      .select("id, batch_name, batch_number")
      .eq("id", batch_id)
      .single()

    // Create JWT token
    const token = jwt.sign(
      {
        userId: student.id,
        email: student.email,
        role: "student",
        department_id: student.department_id,
        batch_id: student.batch_id,
        sub: student.id,
        user: student.email
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Students get 7 day sessions
    )

    // Create session in database
    const sessionToken = jwt.sign(
      { userId: student.id, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: sessionError } = await supabase
      .from("student_sessions")
      .insert({
        student_id: student.id,
        session_token: sessionToken,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        user_agent: request.headers.get("user-agent") || null,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      })

    if (sessionError) {
      console.error("Error creating student session:", sessionError)
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        id: student.id,
        email: student.email,
        full_name: student.full_name,
        role: "student",
        department_id: student.department_id,
        batch_id: student.batch_id,
        department,
        batch,
        created_at: student.created_at,
        updated_at: student.updated_at
      },
      redirectUrl: "/"
    })
  } catch (error) {
    console.error("Student login error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
