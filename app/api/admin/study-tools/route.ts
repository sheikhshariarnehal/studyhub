import { NextResponse, type NextRequest } from "next/server"
import { createDB } from "@/lib/supabase"
import { getAuthUser, isContributor, isAdmin, getContentFilterForUser, canManageContent } from "@/lib/auth-utils"

/* --------------------------------  GET  ---------------------------------- */
export async function GET(request: NextRequest) {
  const db = createDB()
  const user = await getAuthUser(request)
  const { searchParams } = new URL(request.url)
  
  // Get viewing context from query params
  const viewDepartmentId = searchParams.get('department_id') || undefined
  const viewBatchId = searchParams.get('batch_id') || undefined

  let query = db
    .from("study_tools")
    .select(
      `
        id,
        title,
        type,
        content_url,
        exam_type,
        department_id,
        batch_id,
        created_at,
        updated_at,
        course:courses (
          id,
          title,
          course_code,
          semester:semesters ( title )
        ),
        departments:department_id (id, name, short_name),
        batches:batch_id (id, batch_name, batch_number)
      `,
    )
    .order("created_at", { ascending: false })

  // Apply department/batch filtering for contributors
  if (user && isContributor(user)) {
    const contentFilter = getContentFilterForUser(user, viewDepartmentId, viewBatchId)
    
    if (contentFilter.department_id) {
      query = query.eq('department_id', contentFilter.department_id)
    }
    if (contentFilter.batch_id) {
      query = query.eq('batch_id', contentFilter.batch_id)
    }
    if (contentFilter.excludeNullDeptBatch) {
      query = query.not('department_id', 'is', null).not('batch_id', 'is', null)
    }
  } else {
    if (viewDepartmentId) {
      query = query.eq('department_id', viewDepartmentId)
    }
    if (viewBatchId) {
      query = query.eq('batch_id', viewBatchId)
    }
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map semester.title -> name so the UI gets {semester:{name}}
  const mapped = (data ?? []).map((tool) => ({
    ...tool,
    course: tool.course && tool.course[0] ? {
      ...tool.course[0],
      semester: { name: tool.course[0].semester?.[0]?.title ?? "" },
    } : null,
    canEdit: user ? (isAdmin(user) || canManageContent(user, tool.department_id, tool.batch_id)) : false,
  }))

  return NextResponse.json(mapped)
}

/* --------------------------------  POST  --------------------------------- */
/* body: { title, type, content_url, course_id, exam_type } */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  if (isContributor(user) && !user.is_approved) {
    return NextResponse.json({ error: "Your account is pending approval" }, { status: 403 })
  }
  
  if (isContributor(user) && (!user.department_id || !user.batch_id)) {
    return NextResponse.json({ error: "Your profile must have a department and batch assigned" }, { status: 403 })
  }

  const { title, type, content_url, course_id, exam_type, department_id, batch_id } = await req.json()
  const db = createDB()

  // Validate required fields
  if (!title || !type || !course_id) {
    return NextResponse.json(
      { error: "Missing required fields: title, type, and course_id are required" },
      { status: 400 }
    )
  }

  // Validate type
  const validTypes = ["previous_questions", "exam_note", "syllabus", "mark_distribution"]
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    )
  }

  // Validate exam_type
  const validExamTypes = ["midterm", "final", "both"]
  if (exam_type && !validExamTypes.includes(exam_type)) {
    return NextResponse.json(
      { error: `Invalid exam_type. Must be one of: ${validExamTypes.join(", ")}` },
      { status: 400 }
    )
  }

  // Determine department_id and batch_id
  const finalDepartmentId = isContributor(user) ? user.department_id : (department_id || null)
  const finalBatchId = isContributor(user) ? user.batch_id : (batch_id || null)

  const { data, error } = await db
    .from("study_tools")
    .insert({ 
      title, 
      type, 
      content_url, 
      course_id, 
      exam_type: exam_type || "both",
      created_by: user.id,
      department_id: finalDepartmentId,
      batch_id: finalBatchId,
    })
    .select(
      `
        id,
        title,
        type,
        content_url,
        exam_type,
        department_id,
        batch_id,
        created_at,
        updated_at,
        course:courses (
          id,
          title,
          course_code,
          semester:semesters ( title )
        )
      `,
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ...data,
    course: data.course && data.course[0] ? {
      ...data.course[0],
      semester: { name: data.course[0].semester?.[0]?.title ?? "" }
    } : null,
  })
}
