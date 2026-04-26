import { NextResponse, type NextRequest } from "next/server"
import {
  notFoundResponse,
  errorResponse,
  validateUUID,
  getSupabaseClient,
  withErrorHandler,
} from "@/lib/api-utils"

/**
 * GET /api/slides-simple/[id]
 * Simplified endpoint to fetch a slide with topic and course context
 * Used for sharing and direct access
 * Returns raw data (not wrapped) for backward compatibility
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    
    // Validate UUID format
    const validationError = validateUUID(id, "slide")
    if (validationError) return validationError

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("slides")
      .select(`
        id, 
        title, 
        google_drive_url, 
        description,
        file_size_mb,
        slide_count,
        is_downloadable,
        topic:topics!slides_topic_id_fkey(
          id, 
          title,
          course:courses!topics_course_id_fkey(
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
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return notFoundResponse("Slide")
      }
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    if (!data) {
      return notFoundResponse("Slide")
    }

    // Format response with full context - return raw data for backward compatibility
    const response = {
      id: data.id,
      title: data.title,
      url: data.google_drive_url,
      topicId: data.topic?.id,
      courseId: data.topic?.course?.id,
      description: data.description,
      type: "slide" as const,
      file_size_mb: data.file_size_mb,
      slide_count: data.slide_count,
      is_downloadable: data.is_downloadable,
      topic: data.topic ? {
        id: data.topic.id,
        title: data.topic.title,
      } : undefined,
      course: data.topic?.course ? {
        id: data.topic.course.id,
        title: data.topic.course.title,
        course_code: data.topic.course.course_code,
        teacher_name: data.topic.course.teacher_name,
        semester: data.topic.course.semester ? {
          id: data.topic.course.semester.id,
          title: data.topic.course.semester.title,
          section: data.topic.course.semester.section,
          is_active: data.topic.course.semester.is_active,
        } : undefined,
      } : undefined,
      semesterInfo: data.topic?.course?.semester ? {
        id: data.topic.course.semester.id,
        title: data.topic.course.semester.title,
        section: data.topic.course.semester.section,
        is_active: data.topic.course.semester.is_active,
      } : undefined,
    }

    // Return raw JSON for backward compatibility with frontend
    return NextResponse.json(response)
  })
}
