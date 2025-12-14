import { type NextRequest } from "next/server"
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  validateUUID,
  parseQueryParams,
  getSupabaseClient,
  withErrorHandler,
  type Slide,
} from "@/lib/api-utils"

/**
 * GET /api/topics/[id]/slides
 * Fetch all slides for a specific topic
 * 
 * Query Parameters:
 * - isDownloadable: 'true' or 'false' to filter
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
    const isDownloadable = searchParams.get('isDownloadable')

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
      .from("slides")
      .select('*', { count: 'exact' })
      .eq("topic_id", topicId)

    // Apply filters
    if (isDownloadable === 'true') {
      query = query.eq('is_downloadable', true)
    } else if (isDownloadable === 'false') {
      query = query.eq('is_downloadable', false)
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
        slides: data as Slide[],
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
 * POST /api/topics/[id]/slides
 * Create a new slide in a specific topic
 * 
 * Required Body:
 * - title: string
 * - google_drive_url: string (must be a valid Google Drive URL)
 * 
 * Optional Body:
 * - description: string
 * - order_index: number (default: auto-increment)
 * - file_size_mb: number
 * - slide_count: number
 * - is_downloadable: boolean (default: true)
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
    if (!body.google_drive_url?.trim()) {
      return errorResponse("Google Drive URL is required", 400)
    }

    // Validate Google Drive URL format
    const driveUrlPattern = /^https:\/\/(drive|docs|sheets|forms)\.google\.com\/.*/i
    if (!driveUrlPattern.test(body.google_drive_url)) {
      return errorResponse("Invalid Google Drive URL format", 400)
    }

    // Validate file_size_mb if provided
    if (body.file_size_mb !== undefined) {
      const size = parseFloat(body.file_size_mb)
      if (isNaN(size) || size <= 0) {
        return errorResponse("File size must be a positive number", 400)
      }
    }

    // Validate slide_count if provided
    if (body.slide_count !== undefined) {
      const count = parseInt(body.slide_count)
      if (isNaN(count) || count <= 0) {
        return errorResponse("Slide count must be a positive integer", 400)
      }
    }

    // Get next order_index if not provided
    let orderIndex = body.order_index
    if (orderIndex === undefined) {
      const { data: maxOrder } = await supabase
        .from("slides")
        .select("order_index")
        .eq("topic_id", topicId)
        .order("order_index", { ascending: false })
        .limit(1)
        .single()
      orderIndex = (maxOrder?.order_index ?? -1) + 1
    }

    const { data, error } = await supabase
      .from("slides")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        google_drive_url: body.google_drive_url.trim(),
        topic_id: topicId,
        order_index: orderIndex,
        file_size_mb: body.file_size_mb || null,
        slide_count: body.slide_count || null,
        is_downloadable: body.is_downloadable ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      // Check for URL validation error
      if (error.message.includes('google_drive_url')) {
        return errorResponse("Invalid Google Drive URL format", 400)
      }
      return errorResponse(error.message, 500)
    }

    return successResponse(data as Slide, "Slide created successfully", undefined, 201)
  })
}
