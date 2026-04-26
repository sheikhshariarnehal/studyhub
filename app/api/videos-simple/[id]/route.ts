import { NextResponse, type NextRequest } from "next/server"
import {
  notFoundResponse,
  errorResponse,
  validateUUID,
  getSupabaseClient,
  withErrorHandler,
} from "@/lib/api-utils"

/**
 * GET /api/videos-simple/[id]
 * Simplified endpoint to fetch a video with topic and course context
 * Used for sharing and direct access
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    
    // Validate UUID format
    const validationError = validateUUID(id, "video")
    if (validationError) return validationError

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("videos")
      .select(`
        id, 
        title, 
        youtube_url, 
        description,
        duration_minutes,
        video_quality,
        has_subtitles,
        language,
        view_count,
        is_published,
        topic:topics!videos_topic_id_fkey(
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
        return notFoundResponse("Video")
      }
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    if (!data) {
      return notFoundResponse("Video")
    }

    // Increment view count asynchronously (fire and forget)
    supabase
      .from("videos")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id)
      .then(() => {})
      .catch(err => console.error("Failed to update view count:", err))

    // Format response with full context
    const response = {
      id: data.id,
      title: data.title,
      url: data.youtube_url,
      topicId: data.topic?.id,
      courseId: data.topic?.course?.id,
      description: data.description,
      type: "video" as const,
      duration_minutes: data.duration_minutes,
      video_quality: data.video_quality,
      has_subtitles: data.has_subtitles,
      language: data.language,
      view_count: data.view_count,
      is_published: data.is_published,
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
