import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser, isContributor, isAdmin, getContentFilterForUser, canManageContent } from "@/lib/auth-utils"

/**
 * GET /api/courses
 * Fetch all courses with optional filtering
 * 
 * Query Parameters:
 * - semester_id: filter by semester
 * - search: search by title or course code
 * - department_id: filter by department (for context switching)
 * - batch_id: filter by batch (for context switching)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semester_id")
    const search = searchParams.get("search")
    
    // Get viewing context from query params
    const viewDepartmentId = searchParams.get('department_id') || undefined
    const viewBatchId = searchParams.get('batch_id') || undefined

    let query = supabase
      .from("courses")
      .select(`
        id,
        title,
        course_code,
        teacher_name,
        teacher_email,
        description,
        credits,
        semester_id,
        is_active,
        is_highlighted,
        created_at,
        created_by,
        department_id,
        batch_id,
        semester:semesters (
          id,
          title,
          section
        ),
        departments:department_id (id, name, short_name),
        batches:batch_id (id, batch_name, batch_number)
      `)
      .order("course_code", { ascending: true })

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

    // Add canEdit flag for each course
    const coursesWithPermissions = (courses || []).map(course => ({
      ...course,
      canEdit: user ? (isAdmin(user) || canManageContent(user, course.department_id, course.batch_id)) : false,
    }))

    return NextResponse.json({
      success: true,
      courses: coursesWithPermissions,
      // Include user context for UI
      userContext: user ? {
        role: user.role,
        department_id: user.department_id,
        batch_id: user.batch_id,
      } : null,
    })
  } catch (error) {
    console.error("Error in courses API:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/courses
 * Create a new course
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const body = await request.json()

    // Require authentication
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login" },
        { status: 401 }
      )
    }

    // Check if contributor is approved
    if (isContributor(user) && !user.is_approved) {
      return NextResponse.json(
        { success: false, error: "Your account is pending approval" },
        { status: 403 }
      )
    }

    // Contributors must have department and batch assigned
    if (isContributor(user)) {
      if (!user.department_id || !user.batch_id) {
        return NextResponse.json(
          { success: false, error: "Your profile must have a department and batch assigned before creating content" },
          { status: 403 }
        )
      }
    }

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      )
    }
    if (!body.course_code?.trim()) {
      return NextResponse.json(
        { success: false, error: "Course code is required" },
        { status: 400 }
      )
    }
    if (!body.teacher_name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Teacher name is required" },
        { status: 400 }
      )
    }

    // Determine department_id and batch_id
    const departmentId = isContributor(user) ? user.department_id : (body.department_id || null)
    const batchId = isContributor(user) ? user.batch_id : (body.batch_id || null)

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: body.title.trim(),
        course_code: body.course_code.trim(),
        teacher_name: body.teacher_name.trim(),
        teacher_email: body.teacher_email?.trim() || null,
        description: body.description?.trim() || null,
        credits: body.credits || 3,
        semester_id: body.semester_id || null,
        is_active: body.is_active ?? true,
        is_highlighted: body.is_highlighted ?? false,
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
      console.error("Error creating course:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course: data,
      message: "Course created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error in courses POST API:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
