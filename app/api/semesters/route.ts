import { type NextRequest } from "next/server"
import {
  successResponse,
  errorResponse,
  parseQueryParams,
  getSupabaseClient,
  withErrorHandler,
  type Semester,
  type SemesterWithCourses,
} from "@/lib/api-utils"

/**
 * GET /api/semesters
 * Fetch all semesters with optional filtering, pagination, and course inclusion
 * 
 * Query Parameters:
 * - include: 'courses' to include related courses
 * - isActive: 'true' or 'false' to filter by active status
 * - search: string to search in title and section
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - sortBy: field to sort by (default: 'created_at')
 * - sortOrder: 'asc' or 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const params = parseQueryParams(searchParams)
    const includeCourses = searchParams.get('include') === 'courses'

    // Build query with optional course inclusion
    let query = supabase
      .from("semesters")
      .select(
        includeCourses
          ? `
            *,
            courses!courses_semester_id_fkey(
              id, 
              title, 
              course_code, 
              teacher_name, 
              description,
              credits,
              is_active, 
              is_highlighted
            )
          `
          : '*',
        { count: 'exact' }
      )

    // Apply filters
    if (params.isActive !== undefined) {
      query = query.eq('is_active', params.isActive)
    }

    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,section.ilike.%${params.search}%`)
    }

    // Apply sorting (active first, then by specified field)
    query = query
      .order('is_active', { ascending: false })
      .order(params.sortBy || 'created_at', { ascending: params.sortOrder === 'asc' })
      .range((params.page! - 1) * params.limit!, params.page! * params.limit! - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(data as (Semester | SemesterWithCourses)[], undefined, {
      total: count || 0,
      page: params.page,
      limit: params.limit,
      hasMore: count ? (params.page! * params.limit!) < count : false,
    })
  })
}

/**
 * POST /api/semesters
 * Create a new semester
 * 
 * Required Body:
 * - title: string
 * - section: string
 * 
 * Optional Body:
 * - description: string
 * - has_midterm: boolean (default: true)
 * - has_final: boolean (default: true)
 * - start_date: date string
 * - end_date: date string
 * - default_credits: number (default: 3)
 * - is_active: boolean (default: true)
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = getSupabaseClient()
    const body = await request.json()

    // Validate required fields
    if (!body.title?.trim()) {
      return errorResponse("Title is required", 400)
    }
    if (!body.section?.trim()) {
      return errorResponse("Section is required", 400)
    }

    // Validate date range if both provided
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date)
      const endDate = new Date(body.end_date)
      if (startDate >= endDate) {
        return errorResponse("Start date must be before end date", 400)
      }
    }

    // Validate credits if provided
    if (body.default_credits !== undefined) {
      const credits = parseInt(body.default_credits)
      if (isNaN(credits) || credits < 1 || credits > 6) {
        return errorResponse("Credits must be between 1 and 6", 400)
      }
    }

    const { data, error } = await supabase
      .from("semesters")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        section: body.section.trim(),
        has_midterm: body.has_midterm ?? true,
        has_final: body.has_final ?? true,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        default_credits: body.default_credits || 3,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(data as Semester, "Semester created successfully", undefined, 201)
  })
}
