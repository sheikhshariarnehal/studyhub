import { type NextRequest } from "next/server"
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  validateUUID,
  parseQueryParams,
  getSupabaseClient,
  withErrorHandler,
  type Topic,
  type TopicWithContent,
  type Slide,
  type Video,
} from "@/lib/api-utils"

/**
 * GET /api/courses/[id]/topics
 * Fetch all topics for a specific course with optional content (slides/videos)
 * 
 * Query Parameters:
 * - include: 'content' | 'slides' | 'videos' to include related content
 * - isPublished: 'true' or 'false' to filter by published status
 * - difficulty: 'beginner' | 'intermediate' | 'advanced'
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
    const include = searchParams.get('include')
    const difficulty = searchParams.get('difficulty')

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, course_code")
      .eq("id", courseId)
      .single()

    if (courseError || !course) {
      return notFoundResponse("Course")
    }

    // Build select query based on include parameter
    let selectQuery = '*'
    if (include === 'content' || include === 'slides' || include === 'videos') {
      const slidesSelect = include !== 'videos' ? `
        slides!slides_topic_id_fkey(
          id, title, description, google_drive_url, order_index,
          file_size_mb, slide_count, is_downloadable, created_at
        )
      ` : ''
      const videosSelect = include !== 'slides' ? `
        videos!videos_topic_id_fkey(
          id, title, description, youtube_url, order_index,
          duration_minutes, video_quality, has_subtitles, 
          language, is_published, view_count, created_at
        )
      ` : ''
      selectQuery = `*${slidesSelect ? ',' + slidesSelect : ''}${videosSelect ? ',' + videosSelect : ''}`
    }

    // Build query
    let query = supabase
      .from("topics")
      .select(selectQuery, { count: 'exact' })
      .eq("course_id", courseId)

    // Apply filters
    if (queryParams.isPublished !== undefined) {
      query = query.eq('is_published', queryParams.isPublished)
    }
    if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      query = query.eq('difficulty_level', difficulty)
    }
    if (queryParams.search) {
      query = query.or(`title.ilike.%${queryParams.search}%,description.ilike.%${queryParams.search}%`)
    }

    // Apply sorting
    query = query
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })
      .range(
        (queryParams.page! - 1) * queryParams.limit!,
        queryParams.page! * queryParams.limit! - 1
      )

    const { data, error, count } = await query

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    // Sort slides and videos by order_index if included
    const transformedData = (data || []).map((topic: TopicWithContent) => ({
      ...topic,
      slides: topic.slides?.sort((a: Slide, b: Slide) => a.order_index - b.order_index) || undefined,
      videos: topic.videos?.sort((a: Video, b: Video) => a.order_index - b.order_index) || undefined,
    }))

    return successResponse(
      transformedData as (Topic | TopicWithContent)[],
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
 * POST /api/courses/[id]/topics
 * Create a new topic in a specific course
 * 
 * Required Body:
 * - title: string
 * 
 * Optional Body:
 * - description: string
 * - order_index: number (default: auto-increment)
 * - estimated_duration_minutes: number
 * - difficulty_level: 'beginner' | 'intermediate' | 'advanced'
 * - is_published: boolean (default: true)
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

    // Validate difficulty_level if provided
    if (body.difficulty_level && !['beginner', 'intermediate', 'advanced'].includes(body.difficulty_level)) {
      return errorResponse("Invalid difficulty level. Must be: beginner, intermediate, or advanced", 400)
    }

    // Validate estimated_duration_minutes if provided
    if (body.estimated_duration_minutes !== undefined) {
      const duration = parseInt(body.estimated_duration_minutes)
      if (isNaN(duration) || duration <= 0) {
        return errorResponse("Estimated duration must be a positive number", 400)
      }
    }

    // Get next order_index if not provided
    let orderIndex = body.order_index
    if (orderIndex === undefined) {
      const { data: maxOrder } = await supabase
        .from("topics")
        .select("order_index")
        .eq("course_id", courseId)
        .order("order_index", { ascending: false })
        .limit(1)
        .single()
      orderIndex = (maxOrder?.order_index ?? -1) + 1
    }

    const { data, error } = await supabase
      .from("topics")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        course_id: courseId,
        order_index: orderIndex,
        estimated_duration_minutes: body.estimated_duration_minutes || null,
        difficulty_level: body.difficulty_level || null,
        is_published: body.is_published ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message, 500)
    }

    return successResponse(data as Topic, "Topic created successfully", undefined, 201)
  })
}
