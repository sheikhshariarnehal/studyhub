import { NextResponse, type NextRequest } from "next/server"
import {
  notFoundResponse,
  errorResponse,
  validateUUID,
  getSupabaseClient,
  withErrorHandler,
} from "@/lib/api-utils"

/**
 * GET /api/study-tools-simple/[id]
 * Simplified endpoint to fetch a study tool with course context
 * Used for sharing and direct access
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    
    // Validate UUID format
    const validationError = validateUUID(id, "study tool")
    if (validationError) return validationError

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("study_tools")
      .select(`
        id, 
        title, 
        description,
        type,
        content_url,
        exam_type,
        file_size_mb,
        file_format,
        academic_year,
        is_downloadable,
        download_count,
        course:courses!study_tools_course_id_fkey(
          id, 
          title, 
          course_code,
          teacher_name,
          semester:semesters!courses_semester_id_fkey(
            id,
            title,
            section,
            is_active
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return notFoundResponse("Study tool")
      }
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    if (!data) {
      return notFoundResponse("Study tool")
    }

    // Increment download count asynchronously if it's downloadable
    if (data.is_downloadable) {
      supabase
        .from("study_tools")
        .update({ download_count: (data.download_count || 0) + 1 })
        .eq("id", id)
        .then(() => {})
        .catch(err => console.error("Failed to update download count:", err))
    }

    // Determine content type based on study tool type
    const studyToolType = data.type === 'syllabus' ? 'syllabus' : 'study-tool'

    // Format response with full context
    const response = {
      id: data.id,
      title: data.title,
      url: data.content_url,
      courseId: data.course?.id,
      description: data.description,
      type: studyToolType as 'syllabus' | 'study-tool',
      studyToolType: data.type,
      exam_type: data.exam_type,
      file_size_mb: data.file_size_mb,
      file_format: data.file_format,
      academic_year: data.academic_year,
      is_downloadable: data.is_downloadable,
      download_count: data.download_count,
      course: data.course ? {
        id: data.course.id,
        title: data.course.title,
        course_code: data.course.course_code,
        teacher_name: data.course.teacher_name,
        semester: data.course.semester ? {
          id: data.course.semester.id,
          title: data.course.semester.title,
          section: data.course.semester.section,
          is_active: data.course.semester.is_active,
        } : undefined,
      } : undefined,
      semesterInfo: data.course?.semester ? {
        id: data.course.semester.id,
        title: data.course.semester.title,
        section: data.course.semester.section,
        is_active: data.course.semester.is_active,
      } : undefined,
    }

    // Return raw JSON for backward compatibility with frontend
    return NextResponse.json(response)
  })
}
