import { type NextRequest } from "next/server"
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  validateUUID,
  parseQueryParams,
  getSupabaseClient,
  withErrorHandler,
  type Course,
  type CourseWithRelations,
} from "@/lib/api-utils"
import { getAuthUser, isContributor } from "@/lib/auth-utils"

/**
 * GET /api/semesters/[id]/courses
 * Fetch all courses for a specific semester
 * 
 * Query Parameters:
 * - include: 'topics' | 'tools' | 'full' to include related data
 * - isActive: 'true' or 'false' to filter by active status
 * - isHighlighted: 'true' or 'false' to filter highlighted courses
 * - search: string to search in title, course_code, teacher_name
 * - page, limit, sortBy, sortOrder: pagination parameters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id: semesterId } = await params
    
    // Validate UUID format
    const validationError = validateUUID(semesterId, "semester")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const queryParams = parseQueryParams(searchParams)
    const include = searchParams.get('include')
    const isHighlighted = searchParams.get('isHighlighted')

    // Verify semester exists
    const { data: semester, error: semesterError } = await supabase
      .from("semesters")
      .select("id, title")
      .eq("id", semesterId)
      .single()

    if (semesterError || !semester) {
      return notFoundResponse("Semester")
    }

    // Build select query based on include parameter
    let selectQuery = '*'
    if (include === 'topics') {
      selectQuery = `
        *,
        topics!topics_course_id_fkey(
          id, title, description, order_index, difficulty_level, 
          estimated_duration_minutes, is_published
        )
      `
    } else if (include === 'tools') {
      selectQuery = `
        *,
        study_tools!study_tools_course_id_fkey(
          id, title, type, exam_type, content_url, 
          file_format, academic_year, is_downloadable, download_count
        )
      `
    } else if (include === 'full') {
      selectQuery = `
        *,
        topics!topics_course_id_fkey(
          id, title, description, order_index, difficulty_level,
          estimated_duration_minutes, is_published,
          slides!slides_topic_id_fkey(
            id, title, description, google_drive_url, order_index,
            file_size_mb, slide_count, is_downloadable
          ),
          videos!videos_topic_id_fkey(
            id, title, description, youtube_url, order_index,
            duration_minutes, video_quality, has_subtitles, view_count, is_published
          )
        ),
        study_tools!study_tools_course_id_fkey(
          id, title, type, exam_type, content_url,
          file_format, academic_year, is_downloadable, download_count
        )
      `
    }

    // Build query
    let query = supabase
      .from("courses")
      .select(selectQuery, { count: 'exact' })
      .eq("semester_id", semesterId)

    // Apply filters
    if (queryParams.isActive !== undefined) {
      query = query.eq('is_active', queryParams.isActive)
    }
    if (isHighlighted === 'true') {
      query = query.eq('is_highlighted', true)
    } else if (isHighlighted === 'false') {
      query = query.eq('is_highlighted', false)
    }
    if (queryParams.search) {
      query = query.or(
        `title.ilike.%${queryParams.search}%,course_code.ilike.%${queryParams.search}%,teacher_name.ilike.%${queryParams.search}%`
      )
    }

    // Apply sorting (highlighted first, then by specified field)
    query = query
      .order('is_highlighted', { ascending: false })
      .order(queryParams.sortBy || 'created_at', { ascending: queryParams.sortOrder === 'asc' })
      .range(
        (queryParams.page! - 1) * queryParams.limit!,
        queryParams.page! * queryParams.limit! - 1
      )

    const { data, error, count } = await query

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(
      data as (Course | CourseWithRelations)[],
      undefined,
      {
        total: count || 0,
        page: queryParams.page,
        limit: queryParams.limit,
        hasMore: count ? (queryParams.page! * queryParams.limit!) < count : false,
      }
    )
  })
}

/**
 * POST /api/semesters/[id]/courses
 * Create a new course in a specific semester
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id: semesterId } = await params
    const user = await getAuthUser(request)
    
    // Require authentication
    if (!user) {
      return errorResponse("Unauthorized - Please login", 401)
    }

    // Check if contributor is approved
    if (isContributor(user) && !user.is_approved) {
      return errorResponse("Your account is pending approval", 403)
    }
    
    // Validate UUID format
    const validationError = validateUUID(semesterId, "semester")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const body = await request.json()

    // Verify semester exists
    const { data: semester, error: semesterError } = await supabase
      .from("semesters")
      .select("id, default_credits, created_by")
      .eq("id", semesterId)
      .single()

    if (semesterError || !semester) {
      return notFoundResponse("Semester")
    }

    // Contributors can only add courses to their own semesters
    if (isContributor(user) && semester.created_by !== user.id) {
      return errorResponse("Access denied - You can only add courses to your own semesters", 403)
    }

    // Validate required fields
    if (!body.title?.trim()) {
      return errorResponse("Title is required", 400)
    }
    if (!body.course_code?.trim()) {
      return errorResponse("Course code is required", 400)
    }
    if (!body.teacher_name?.trim()) {
      return errorResponse("Teacher name is required", 400)
    }

    // Validate email format if provided
    if (body.teacher_email) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(body.teacher_email)) {
        return errorResponse("Invalid email format", 400)
      }
    }

    // Validate credits if provided
    const credits = body.credits ?? semester.default_credits
    if (credits < 1 || credits > 6) {
      return errorResponse("Credits must be between 1 and 6", 400)
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: body.title.trim(),
        course_code: body.course_code.trim().toUpperCase(),
        teacher_name: body.teacher_name.trim(),
        teacher_email: body.teacher_email?.trim() || null,
        description: body.description?.trim() || null,
        credits,
        semester_id: semesterId,
        is_active: body.is_active ?? true,
        is_highlighted: body.is_highlighted ?? false,
        created_by: user.id,  // Track who created this course
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(data as Course, "Course created successfully", undefined, 201)
  })
}
