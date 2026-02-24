import { NextResponse } from "next/server"
import { errorResponse, getSupabaseClient } from "@/lib/api-utils"

export const revalidate = 60

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
}

/**
 * GET /api/courses
 * Fetch all courses with optional filtering
 */
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient()
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
      return errorResponse("Failed to fetch courses", 500, error)
    }

    return NextResponse.json(
      { success: true, courses: courses || [] },
      { headers: CACHE_HEADERS }
    )
  } catch (error) {
    return errorResponse(
      "Internal server error",
      500,
      error instanceof Error ? error.message : "Unknown error"
    )
  }
}
