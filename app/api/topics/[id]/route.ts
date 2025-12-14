import { type NextRequest } from "next/server"
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  validateUUID,
  getSupabaseClient,
  withErrorHandler,
  type Topic,
  type TopicWithContent,
} from "@/lib/api-utils"

/**
 * GET /api/topics/[id]
 * Fetch a specific topic with optional content (slides/videos)
 * 
 * Query Parameters:
 * - include: 'content' | 'slides' | 'videos' | 'full' to include related content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    
    // Validate UUID format
    const validationError = validateUUID(id, "topic")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include')

    // Build select query based on include parameter
    let selectQuery = `
      *,
      course:courses!topics_course_id_fkey(
        id, title, course_code, teacher_name,
        semester:semesters!courses_semester_id_fkey(id, title, section)
      )
    `
    
    if (include === 'content' || include === 'full') {
      selectQuery = `
        *,
        course:courses!topics_course_id_fkey(
          id, title, course_code, teacher_name,
          semester:semesters!courses_semester_id_fkey(id, title, section)
        ),
        slides!slides_topic_id_fkey(
          id, title, description, google_drive_url, order_index,
          file_size_mb, slide_count, is_downloadable, created_at
        ),
        videos!videos_topic_id_fkey(
          id, title, description, youtube_url, order_index,
          duration_minutes, video_quality, has_subtitles,
          language, is_published, view_count, created_at
        )
      `
    } else if (include === 'slides') {
      selectQuery = `
        *,
        course:courses!topics_course_id_fkey(id, title, course_code),
        slides!slides_topic_id_fkey(
          id, title, description, google_drive_url, order_index,
          file_size_mb, slide_count, is_downloadable, created_at
        )
      `
    } else if (include === 'videos') {
      selectQuery = `
        *,
        course:courses!topics_course_id_fkey(id, title, course_code),
        videos!videos_topic_id_fkey(
          id, title, description, youtube_url, order_index,
          duration_minutes, video_quality, has_subtitles,
          language, is_published, view_count, created_at
        )
      `
    }

    const { data, error } = await supabase
      .from("topics")
      .select(selectQuery)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return notFoundResponse("Topic")
      }
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    if (!data) {
      return notFoundResponse("Topic")
    }

    // Type assertion for the data with potential slides/videos
    type TopicDataWithContent = TopicWithContent & {
      slides?: Array<{ order_index: number; [key: string]: unknown }>
      videos?: Array<{ order_index: number; [key: string]: unknown }>
      course?: unknown
    }
    const topicData = data as unknown as TopicDataWithContent

    // Sort slides and videos by order_index if included
    const transformedData = {
      ...topicData,
      slides: topicData.slides?.sort((a, b) => a.order_index - b.order_index),
      videos: topicData.videos?.sort((a, b) => a.order_index - b.order_index),
    }

    return successResponse(transformedData)
  })
}

/**
 * PUT /api/topics/[id]
 * Update a specific topic
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    
    // Validate UUID format
    const validationError = validateUUID(id, "topic")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const body = await request.json()

    // Build update object with only allowed fields
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'description', 'order_index', 'estimated_duration_minutes',
      'difficulty_level', 'is_published'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'title' || field === 'description') {
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

    // Validate difficulty_level if provided
    if (updateData.difficulty_level && !['beginner', 'intermediate', 'advanced'].includes(updateData.difficulty_level as string)) {
      return errorResponse("Invalid difficulty level", 400)
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("topics")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return notFoundResponse("Topic")
      }
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(data as Topic, "Topic updated successfully")
  })
}

/**
 * DELETE /api/topics/[id]
 * Delete a specific topic
 * Note: This will also delete related slides and videos (if CASCADE is set)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    
    // Validate UUID format
    const validationError = validateUUID(id, "topic")
    if (validationError) return validationError

    const supabase = getSupabaseClient()

    // Check if topic exists
    const { data: existing, error: checkError } = await supabase
      .from("topics")
      .select("id, title")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return notFoundResponse("Topic")
    }

    // Get content counts for warning
    const { count: slideCount } = await supabase
      .from("slides")
      .select("id", { count: 'exact', head: true })
      .eq("topic_id", id)

    const { count: videoCount } = await supabase
      .from("videos")
      .select("id", { count: 'exact', head: true })
      .eq("topic_id", id)

    // Delete the topic (cascades to slides and videos)
    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(
      { 
        id, 
        title: existing.title,
        deletedContent: {
          slides: slideCount || 0,
          videos: videoCount || 0
        }
      },
      "Topic and related content deleted successfully"
    )
  })
}
