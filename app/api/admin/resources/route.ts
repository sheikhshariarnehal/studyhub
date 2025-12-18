import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// GET - Fetch all resources with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const courseId = searchParams.get("courseId")
    const examType = searchParams.get("examType")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
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
          teacher_name,
          semester:semesters (
            id,
            title,
            section
          )
        )
      `, { count: "exact" })

    // Apply filters
    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    if (courseId && courseId !== "all") {
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
    console.error("Admin resources API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new resource
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      type, 
      content_url, 
      course_id,
      course_name,
      semester_id,
      semester_name, 
      exam_type,
      file_format,
      file_size_mb,
      academic_year,
      is_downloadable = true
    } = body

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ["previous_questions", "exam_note", "syllabus", "mark_distribution", "assignment", "lab_manual", "reference_book"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: resource, error } = await supabase
      .from("study_tools")
      .insert({
        title,
        description,
        type,
        content_url,
        course_id: course_id || null,
        course_name: course_name || null,
        semester_id: semester_id || null,
        semester_name: semester_name || null,
        exam_type: exam_type || "both",
        file_format,
        file_size_mb,
        academic_year,
        is_downloadable,
        download_count: 0,
        view_count: 0
      })
      .select(`
        *,
        course:courses (
          id,
          title,
          course_code,
          teacher_name,
          semester:semesters (
            id,
            title,
            section
          )
        )
      `)
      .single()

    if (error) {
      console.error("Error creating resource:", error)
      return NextResponse.json(
        { error: "Failed to create resource", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resource
    })
  } catch (error) {
    console.error("Admin resources POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
