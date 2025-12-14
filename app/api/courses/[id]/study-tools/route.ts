import { type NextRequest } from "next/server"
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  validateUUID,
  parseQueryParams,
  getSupabaseClient,
  withErrorHandler,
  type StudyTool,
} from "@/lib/api-utils"

// Valid study tool types and exam types from database constraints
const VALID_TOOL_TYPES = [
  'previous_questions', 'exam_note', 'syllabus', 
  'mark_distribution', 'assignment', 'lab_manual', 'reference_book'
] as const

const VALID_EXAM_TYPES = ['midterm', 'final', 'both', 'assignment', 'quiz'] as const

/**
 * GET /api/courses/[id]/study-tools
 * Fetch all study tools for a specific course
 * 
 * Query Parameters:
 * - type: 'previous_questions' | 'exam_note' | 'syllabus' | etc.
 * - examType: 'midterm' | 'final' | 'both' | 'assignment' | 'quiz'
 * - isDownloadable: 'true' or 'false' to filter
 * - academicYear: string to filter by year (e.g., '2024')
 * - search: string to search in title and description
 * - page, limit, sortBy, sortOrder: pagination parameters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id: courseId } = await params
    
    // Validate UUID format
    const validationError = validateUUID(courseId, "course")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const queryParams = parseQueryParams(searchParams)
    const toolType = searchParams.get('type')
    const examType = searchParams.get('examType')
    const isDownloadable = searchParams.get('isDownloadable')
    const academicYear = searchParams.get('academicYear')

    // Verify course exists and get context
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(`
        id, title, course_code, teacher_name,
        semester:semesters!courses_semester_id_fkey(id, title, section)
      `)
      .eq("id", courseId)
      .single()

    if (courseError || !course) {
      return notFoundResponse("Course")
    }

    // Build query
    let query = supabase
      .from("study_tools")
      .select('*', { count: 'exact' })
      .eq("course_id", courseId)

    // Apply filters
    if (toolType && VALID_TOOL_TYPES.includes(toolType as typeof VALID_TOOL_TYPES[number])) {
      query = query.eq('type', toolType)
    }
    if (examType && VALID_EXAM_TYPES.includes(examType as typeof VALID_EXAM_TYPES[number])) {
      query = query.eq('exam_type', examType)
    }
    if (isDownloadable === 'true') {
      query = query.eq('is_downloadable', true)
    } else if (isDownloadable === 'false') {
      query = query.eq('is_downloadable', false)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    if (queryParams.search) {
      query = query.or(`title.ilike.%${queryParams.search}%,description.ilike.%${queryParams.search}%`)
    }

    // Apply sorting
    query = query
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })
      .range(
        (queryParams.page! - 1) * queryParams.limit!,
        queryParams.page! * queryParams.limit! - 1
      )

    const { data, error, count } = await query

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    // Group by type for better organization
    const groupedByType = (data as StudyTool[]).reduce((acc, tool) => {
      if (!acc[tool.type]) {
        acc[tool.type] = []
      }
      acc[tool.type].push(tool)
      return acc
    }, {} as Record<string, StudyTool[]>)

    return successResponse(
      {
        course: {
          id: course.id,
          title: course.title,
          course_code: course.course_code,
          teacher_name: course.teacher_name,
          semester: course.semester,
        },
        study_tools: data as StudyTool[],
        grouped_by_type: groupedByType,
      },
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
 * POST /api/courses/[id]/study-tools
 * Create a new study tool for a specific course
 * 
 * Required Body:
 * - title: string
 * - type: 'previous_questions' | 'exam_note' | 'syllabus' | etc.
 * 
 * Optional Body:
 * - description: string
 * - content_url: string (must be valid URL)
 * - exam_type: 'midterm' | 'final' | 'both' | 'assignment' | 'quiz' (default: 'both')
 * - file_size_mb: number
 * - file_format: string (e.g., 'pdf', 'docx')
 * - academic_year: string (e.g., '2024')
 * - is_downloadable: boolean (default: true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id: courseId } = await params
    
    // Validate UUID format
    const validationError = validateUUID(courseId, "course")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const body = await request.json()

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single()

    if (courseError || !course) {
      return notFoundResponse("Course")
    }

    // Validate required fields
    if (!body.title?.trim()) {
      return errorResponse("Title is required", 400)
    }
    if (!body.type) {
      return errorResponse("Type is required", 400)
    }

    // Validate type
    if (!VALID_TOOL_TYPES.includes(body.type)) {
      return errorResponse(
        `Invalid type. Must be one of: ${VALID_TOOL_TYPES.join(', ')}`,
        400
      )
    }

    // Validate exam_type if provided
    if (body.exam_type && !VALID_EXAM_TYPES.includes(body.exam_type)) {
      return errorResponse(
        `Invalid exam type. Must be one of: ${VALID_EXAM_TYPES.join(', ')}`,
        400
      )
    }

    // Validate content_url if provided
    if (body.content_url) {
      const urlPattern = /^https?:\/\/.*/i
      if (!urlPattern.test(body.content_url)) {
        return errorResponse("Invalid URL format", 400)
      }
    }

    // Validate file_size_mb if provided
    if (body.file_size_mb !== undefined) {
      const size = parseFloat(body.file_size_mb)
      if (isNaN(size) || size <= 0) {
        return errorResponse("File size must be a positive number", 400)
      }
    }

    const { data, error } = await supabase
      .from("study_tools")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        type: body.type,
        content_url: body.content_url?.trim() || null,
        course_id: courseId,
        exam_type: body.exam_type || 'both',
        file_size_mb: body.file_size_mb || null,
        file_format: body.file_format?.trim() || null,
        academic_year: body.academic_year?.trim() || null,
        is_downloadable: body.is_downloadable ?? true,
        download_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(data as StudyTool, "Study tool created successfully", undefined, 201)
  })
}
