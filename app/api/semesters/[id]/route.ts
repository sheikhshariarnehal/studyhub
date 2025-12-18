import { NextRequest } from "next/server"
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  validateUUID,
  getSupabaseClient,
  withErrorHandler,
  type Semester,
} from "@/lib/api-utils"
import { getAuthUser, isContributor } from "@/lib/auth-utils"

/**
 * GET /api/semesters/[id]
 * Fetch a specific semester with optional related data
 * 
 * Query Parameters:
 * - include: 'courses' | 'full' to include related data
 *   - 'courses': include courses
 *   - 'full': include courses with topics and study tools
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    const user = await getAuthUser(request)
    
    // Validate UUID format
    const validationError = validateUUID(id, "semester")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include')

    // Build select query based on include parameter
    let selectQuery = '*, created_by'
    if (include === 'courses') {
      selectQuery = `
        *,
        courses!courses_semester_id_fkey(
          id, title, course_code, teacher_name, teacher_email,
          description, credits, is_active, is_highlighted, created_at
        )
      `
    } else if (include === 'full') {
      selectQuery = `
        *,
        courses!courses_semester_id_fkey(
          id, title, course_code, teacher_name, teacher_email,
          description, credits, is_active, is_highlighted, created_at,
          topics!topics_course_id_fkey(
            id, title, description, order_index, difficulty_level, is_published
          ),
          study_tools!study_tools_course_id_fkey(
            id, title, type, exam_type, content_url, is_downloadable
          )
        )
      `
    }

    const { data, error } = await supabase
      .from("semesters")
      .select(selectQuery)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return notFoundResponse("Semester")
      }
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    // Contributors can only access their own semesters
    if (user && isContributor(user) && data.created_by !== user.id) {
      return errorResponse("Access denied - You can only view your own semesters", 403)
    }

    return successResponse(data as Semester)
  })
}

/**
 * PUT /api/semesters/[id]
 * Update a specific semester
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    const user = await getAuthUser(request)
    
    // Require authentication
    if (!user) {
      return errorResponse("Unauthorized - Please login", 401)
    }
    
    // Validate UUID format
    const validationError = validateUUID(id, "semester")
    if (validationError) return validationError

    const supabase = getSupabaseClient()

    // Check ownership for contributors
    if (isContributor(user)) {
      const { data: semester } = await supabase
        .from("semesters")
        .select("created_by")
        .eq("id", id)
        .single()
      
      if (semester?.created_by !== user.id) {
        return errorResponse("Access denied - You can only edit your own semesters", 403)
      }
    }

    const body = await request.json()

    // Build update object with only allowed fields
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'description', 'section', 'has_midterm', 'has_final',
      'start_date', 'end_date', 'default_credits', 'is_active'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'title' || field === 'section' || field === 'description') {
          updateData[field] = body[field]?.trim() || null
        } else {
          updateData[field] = body[field]
        }
      }
    }

    // Validate at least one field to update
    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields to update", 400)
    }

    // Validate date range if both provided
    if (updateData.start_date && updateData.end_date) {
      const startDate = new Date(updateData.start_date as string)
      const endDate = new Date(updateData.end_date as string)
      if (startDate >= endDate) {
        return errorResponse("Start date must be before end date", 400)
      }
    }

    // Validate credits if provided
    if (updateData.default_credits !== undefined) {
      const credits = parseInt(updateData.default_credits as string)
      if (isNaN(credits) || credits < 1 || credits > 6) {
        return errorResponse("Credits must be between 1 and 6", 400)
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("semesters")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return notFoundResponse("Semester")
      }
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(data as Semester, "Semester updated successfully")
  })
}

/**
 * DELETE /api/semesters/[id]
 * Delete a specific semester
 * Note: This will fail if there are related courses (foreign key constraint)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    const user = await getAuthUser(request)
    
    // Require authentication
    if (!user) {
      return errorResponse("Unauthorized - Please login", 401)
    }
    
    // Validate UUID format
    const validationError = validateUUID(id, "semester")
    if (validationError) return validationError

    const supabase = getSupabaseClient()

    // Check if semester exists and get ownership info
    const { data: existing, error: checkError } = await supabase
      .from("semesters")
      .select("id, title, created_by")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return notFoundResponse("Semester")
    }

    // Contributors can only delete their own semesters
    if (isContributor(user) && existing.created_by !== user.id) {
      return errorResponse("Access denied - You can only delete your own semesters", 403)
    }

    // Check for related courses
    const { count: courseCount } = await supabase
      .from("courses")
      .select("id", { count: 'exact', head: true })
      .eq("semester_id", id)

    if (courseCount && courseCount > 0) {
      return errorResponse(
        `Cannot delete semester with ${courseCount} associated courses. Please delete or reassign courses first.`,
        400
      )
    }

    // Delete the semester
    const { error } = await supabase
      .from("semesters")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse({ id, title: existing.title }, "Semester deleted successfully")
  })
}
