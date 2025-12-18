import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const courseId = searchParams.get("courseId")
    const examType = searchParams.get("examType")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const supabase = createClient()

    // Build query
    let query = supabase
      .from("study_tools")
      .select(`
        *,
        course:courses (
          id,
          title,
          course_code,
          teacher_name
        )
      `, { count: "exact" })

    // Apply filters
    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    if (courseId) {
      query = query.eq("course_id", courseId)
    }

    if (examType && examType !== "all") {
      query = query.eq("exam_type", examType)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Order and pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: resources, error, count } = await query

    if (error) {
      console.error("Error fetching resources:", error)
      return NextResponse.json(
        { error: "Failed to fetch resources", details: error.message },
        { status: 500 }
      )
    }

    // Get available types for filters
    const { data: typesData } = await supabase
      .from("study_tools")
      .select("type")
      .not("type", "is", null)

    const types = [...new Set(typesData?.map(t => t.type) || [])]

    // Get courses for filter
    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, title, course_code")
      .eq("is_active", true)
      .order("title")

    return NextResponse.json({
      success: true,
      resources: resources || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        types,
        courses: coursesData || [],
        examTypes: ["midterm", "final", "both", "assignment", "quiz"]
      }
    })
  } catch (error) {
    console.error("Resources API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
