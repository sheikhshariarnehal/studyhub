import { type NextRequest } from "next/server"
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  validateUUID,
  parseQueryParams,
  getSupabaseClient,
  withErrorHandler,
  type Video,
} from "@/lib/api-utils"

/**
 * GET /api/topics/[id]/videos
 * Fetch all videos for a specific topic
 * 
 * Query Parameters:
 * - isPublished: 'true' or 'false' to filter
 * - quality: '720p' | '1080p' | '4K' to filter
 * - hasSubtitles: 'true' or 'false' to filter
 * - search: string to search in title and description
 * - page, limit, sortBy, sortOrder: pagination parameters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id: topicId } = await params
    
    // Validate UUID format
    const validationError = validateUUID(topicId, "topic")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const queryParams = parseQueryParams(searchParams)
    const quality = searchParams.get('quality')
    const hasSubtitles = searchParams.get('hasSubtitles')

    // Verify topic exists and get context
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select(`
        id, title,
        course:courses!topics_course_id_fkey(
          id, title, course_code,
          semester:semesters!courses_semester_id_fkey(id, title, section)
        )
      `)
      .eq("id", topicId)
      .single()

    if (topicError || !topic) {
      return notFoundResponse("Topic")
    }

    // Build query
    let query = supabase
      .from("videos")
      .select('*', { count: 'exact' })
      .eq("topic_id", topicId)

    // Apply filters
    if (queryParams.isPublished !== undefined) {
      query = query.eq('is_published', queryParams.isPublished)
    }
    if (quality && ['720p', '1080p', '4K'].includes(quality)) {
      query = query.eq('video_quality', quality)
    }
    if (hasSubtitles === 'true') {
      query = query.eq('has_subtitles', true)
    } else if (hasSubtitles === 'false') {
      query = query.eq('has_subtitles', false)
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

    return successResponse(
      {
        topic: {
          id: topic.id,
          title: topic.title,
          course: topic.course,
        },
        videos: data as Video[],
      },
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
 * POST /api/topics/[id]/videos
 * Create a new video in a specific topic
 * 
 * Required Body:
 * - title: string
 * - youtube_url: string (must be a valid YouTube URL)
 * 
 * Optional Body:
 * - description: string
 * - order_index: number (default: auto-increment)
 * - duration_minutes: number
 * - video_quality: '720p' | '1080p' | '4K'
 * - has_subtitles: boolean (default: false)
 * - language: string (default: 'en')
 * - is_published: boolean (default: true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id: topicId } = await params
    
    // Validate UUID format
    const validationError = validateUUID(topicId, "topic")
    if (validationError) return validationError

    const supabase = getSupabaseClient()
    const body = await request.json()

    // Verify topic exists
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .single()

    if (topicError || !topic) {
      return notFoundResponse("Topic")
    }

    // Validate required fields
    if (!body.title?.trim()) {
      return errorResponse("Title is required", 400)
    }
    if (!body.youtube_url?.trim()) {
      return errorResponse("YouTube URL is required", 400)
    }

    // Validate YouTube URL format
    const youtubeUrlPattern = /^https:\/\/(www\.)?youtube\.com\/watch\?v=.*|^https:\/\/youtu\.be\/.*/i
    if (!youtubeUrlPattern.test(body.youtube_url)) {
      return errorResponse("Invalid YouTube URL format. Must be youtube.com/watch?v=... or youtu.be/...", 400)
    }

    // Validate video_quality if provided
    if (body.video_quality && !['720p', '1080p', '4K'].includes(body.video_quality)) {
      return errorResponse("Invalid video quality. Must be: 720p, 1080p, or 4K", 400)
    }

    // Validate duration_minutes if provided
    if (body.duration_minutes !== undefined) {
      const duration = parseInt(body.duration_minutes)
      if (isNaN(duration) || duration <= 0) {
        return errorResponse("Duration must be a positive integer", 400)
      }
    }

    // Get next order_index if not provided
    let orderIndex = body.order_index
    if (orderIndex === undefined) {
      const { data: maxOrder } = await supabase
        .from("videos")
        .select("order_index")
        .eq("topic_id", topicId)
        .order("order_index", { ascending: false })
        .limit(1)
        .single()
      orderIndex = (maxOrder?.order_index ?? -1) + 1
    }

    const { data, error } = await supabase
      .from("videos")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        youtube_url: body.youtube_url.trim(),
        topic_id: topicId,
        order_index: orderIndex,
        duration_minutes: body.duration_minutes || null,
        video_quality: body.video_quality || null,
        has_subtitles: body.has_subtitles ?? false,
        language: body.language || 'en',
        is_published: body.is_published ?? true,
        view_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      // Check for URL validation error
      if (error.message.includes('youtube_url')) {
        return errorResponse("Invalid YouTube URL format", 400)
      }
      return errorResponse(error.message, 500)
    }

    return successResponse(data as Video, "Video created successfully", undefined, 201)
  })
}
