import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Helper function to verify section admin authorization
async function verifySectionAdmin(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value || 
                  request.cookies.get("jwt")?.value || 
                  request.cookies.get("token")?.value

    if (!token) {
      return { error: "No token provided", status: 401 }
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return { error: "Invalid token", status: 401 }
    }

    // Get current user data
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, department, is_active")
      .eq("id", decoded.userId)
      .eq("is_active", true)
      .single()

    if (userError || !adminUser) {
      return { error: "User not found or inactive", status: 401 }
    }

    // Check if user has section admin role or higher
    if (!["section_admin", "admin", "super_admin"].includes(adminUser.role)) {
      return { error: "Insufficient permissions", status: 403 }
    }

    return { user: adminUser }
  } catch (error) {
    console.error("Authorization error:", error)
    return { error: "Internal server error", status: 500 }
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifySectionAdmin(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user!
    const { id: semesterId } = await params

    // Get semester with all related data
    let query = supabase
      .from("semesters")
      .select(`
        *,
        courses (
          *,
          topics (
            *,
            slides (*),
            videos (*)
          ),
          study_tools (*)
        )
      `)
      .eq("id", semesterId)

    // If user is section admin, ensure they can only access their section's semesters
    if (user.role === "section_admin" && user.department) {
      query = query.eq("section", user.department)
    }

    const { data: semester, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Semester not found" }, { status: 404 })
      }
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch semester" }, { status: 500 })
    }

    // Map title to name for frontend/test compatibility
    const transformedSemester = {
      ...semester,
      name: semester.title,
      year: semester.start_date ? new Date(semester.start_date).getFullYear().toString() : "2025",
      status: semester.is_active ? "active" : "inactive"
    }

    return NextResponse.json(transformedSemester)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifySectionAdmin(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user!
    const { id: semesterId } = await params
    const body = await request.json()

    // Support both nested { semester: {...} } and flat {...} payloads
    const semesterData = body.semester || body
    const courses = body.courses || []

    // First, check if the semester exists and user has permission
    let checkQuery = supabase
      .from("semesters")
      .select("id, section")
      .eq("id", semesterId)

    if (user.role === "section_admin" && user.department) {
      checkQuery = checkQuery.eq("section", user.department)
    }

    const { data: existingSemester, error: checkError } = await checkQuery.single()

    if (checkError || !existingSemester) {
      return NextResponse.json({ error: "Semester not found or access denied" }, { status: 404 })
    }

    // Validate required fields
    const title = semesterData.title || semesterData.name || existingSemester.title
    const section = semesterData.section || existingSemester.section

    if (!title || !section) {
      return NextResponse.json(
        { error: "Missing required fields: title and section" },
        { status: 400 }
      )
    }

    // For section admin, ensure they can only update semesters for their section
    if (user.role === "section_admin" && user.department && section !== user.department) {
      return NextResponse.json(
        { error: "You can only update semesters for your assigned section" },
        { status: 403 }
      )
    }

    // Update semester
    const { data: updatedSemester, error: semesterError } = await supabase
      .from("semesters")
      .update({
        title: title,
        description: semesterData.description !== undefined ? semesterData.description : undefined,
        section: section,
        has_midterm: semesterData.has_midterm !== undefined ? semesterData.has_midterm : undefined,
        has_final: semesterData.has_final !== undefined ? semesterData.has_final : undefined,
        start_date: semesterData.start_date !== undefined ? semesterData.start_date : undefined,
        end_date: semesterData.end_date !== undefined ? semesterData.end_date : undefined,
        default_credits: semesterData.default_credits !== undefined ? semesterData.default_credits : undefined,
        is_active: semesterData.is_active !== undefined ? semesterData.is_active : undefined,
        updated_at: new Date().toISOString()
      })
      .eq("id", semesterId)
      .select()
      .single()

    if (semesterError) {
      console.error("Error updating semester:", semesterError)
      return NextResponse.json(
        { error: "Failed to update semester" },
        { status: 500 }
      )
    }

    // Map title to name for frontend/test compatibility
    const responseSemester = {
      ...updatedSemester,
      name: updatedSemester.title,
      year: updatedSemester.start_date ? new Date(updatedSemester.start_date).getFullYear().toString() : "2025",
      status: updatedSemester.is_active ? "active" : "inactive"
    }

    return NextResponse.json(responseSemester)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifySectionAdmin(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user!
    const { id: semesterId } = await params

    // First, check if the semester exists and user has permission
    let checkQuery = supabase
      .from("semesters")
      .select("id, section, title")
      .eq("id", semesterId)

    if (user.role === "section_admin" && user.department) {
      checkQuery = checkQuery.eq("section", user.department)
    }

    const { data: existingSemester, error: checkError } = await checkQuery.single()

    if (checkError || !existingSemester) {
      return NextResponse.json({ error: "Semester not found or access denied" }, { status: 404 })
    }

    // Delete semester (this will cascade delete related courses, topics, etc. if foreign keys are set up properly)
    const { error: deleteError } = await supabase
      .from("semesters")
      .delete()
      .eq("id", semesterId)

    if (deleteError) {
      console.error("Error deleting semester:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete semester" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Semester "${existingSemester.title}" deleted successfully`
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
