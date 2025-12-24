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
import { getAuthUser, isContributor, isAdmin, getContentFilterForUser, canManageContent } from "@/lib/auth-utils"

/**
 * GET /api/semesters
 * Fetch all semesters with optional filtering, pagination, and course inclusion
 * 
 * Query Parameters:
 * - include: 'courses' to include related courses
 * - isActive: 'true' or 'false' to filter by active status
 * - search: string to search in title and section
 * - department_id: filter by department (for context switching)
 * - batch_id: filter by batch (for context switching)
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * - sortBy: field to sort by (default: 'created_at')
 * - sortOrder: 'asc' or 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = getSupabaseClient()
    const user = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const params = parseQueryParams(searchParams)
    const includeCourses = searchParams.get('include') === 'courses'
    
    // Get viewing context from query params
    const viewDepartmentId = searchParams.get('department_id') || undefined
    const viewBatchId = searchParams.get('batch_id') || undefined

    // Build query with optional course inclusion and department/batch info
    let query = supabase
      .from("semesters")
      .select(
        includeCourses
          ? `
            *,
            departments:department_id (id, name, short_name),
            batches:batch_id (id, batch_name, batch_number),
            courses!courses_semester_id_fkey(
              id, 
              title, 
              course_code, 
              teacher_name, 
              description,
              credits,
              is_active, 
              is_highlighted,
              department_id,
              batch_id
            )
          `
          : `
            *,
            departments:department_id (id, name, short_name),
            batches:batch_id (id, batch_name, batch_number)
          `,
        { count: 'exact' }
      )

    // Apply department/batch filtering for contributors
    if (user && isContributor(user)) {
      const contentFilter = getContentFilterForUser(user, viewDepartmentId, viewBatchId)
      
      // Filter by department if specified
      if (contentFilter.department_id) {
        query = query.eq('department_id', contentFilter.department_id)
      }
      
      // Filter by batch if specified
      if (contentFilter.batch_id) {
        query = query.eq('batch_id', contentFilter.batch_id)
      }
      
      // Exclude content without department/batch for contributors
      if (contentFilter.excludeNullDeptBatch) {
        query = query.not('department_id', 'is', null).not('batch_id', 'is', null)
      }
    } else {
      // For admins, allow optional filtering but don't require it
      if (viewDepartmentId) {
        query = query.eq('department_id', viewDepartmentId)
      }
      if (viewBatchId) {
        query = query.eq('batch_id', viewBatchId)
      }
    }

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

    // Add canEdit flag for each semester
    const semestersWithPermissions = (data || []).map(semester => ({
      ...semester,
      canEdit: user ? (isAdmin(user) || canManageContent(user, semester.department_id, semester.batch_id)) : false,
    }))

    return successResponse(semestersWithPermissions as (Semester | SemesterWithCourses)[], undefined, {
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
 * - department_id: uuid (auto-assigned for contributors)
 * - batch_id: uuid (auto-assigned for contributors)
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const supabase = getSupabaseClient()
    const user = await getAuthUser(request)
    const body = await request.json()

    // Require authentication
    if (!user) {
      return errorResponse("Unauthorized - Please login", 401)
    }

    // Check if contributor is approved
    if (isContributor(user) && !user.is_approved) {
      return errorResponse("Your account is pending approval", 403)
    }

    // Contributors must have department and batch assigned
    if (isContributor(user)) {
      if (!user.department_id || !user.batch_id) {
        return errorResponse("Your profile must have a department and batch assigned before creating content", 403)
      }
    }

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

    // Determine department_id and batch_id
    // For contributors: always use their assigned values
    // For admins: use provided values or null
    const departmentId = isContributor(user) ? user.department_id : (body.department_id || null)
    const batchId = isContributor(user) ? user.batch_id : (body.batch_id || null)

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
        created_by: user.id,
        department_id: departmentId,
        batch_id: batchId,
      })
      .select(`
        *,
        departments:department_id (id, name, short_name),
        batches:batch_id (id, batch_name, batch_number)
      `)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(data as Semester, "Semester created successfully", undefined, 201)
  })
}
