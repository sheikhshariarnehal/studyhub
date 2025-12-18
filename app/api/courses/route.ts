import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/courses
 * Fetch all courses with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semester_id")
    const search = searchParams.get("search")

    let query = supabase
      .from("courses")
      .select(`
        id,
        title,
        course_code,
        teacher_name,
        semester_id,
        semester:semesters (
          id,
          title,
          section
        )
      `)
      .order("course_code", { ascending: true })

    // Filter by semester if provided
    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }

    // Search by title or course code
    if (search) {
      query = query.or(`title.ilike.%${search}%,course_code.ilike.%${search}%`)
    }

    const { data: courses, error } = await query

    if (error) {
      console.error("Error fetching courses:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch courses" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      courses: courses || []
    })
  } catch (error) {
    console.error("Error in courses API:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
