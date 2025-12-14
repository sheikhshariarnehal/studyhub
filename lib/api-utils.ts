import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ContentFilters {
  isActive?: boolean
  isPublished?: boolean
  search?: string
}

// ============================================================================
// Response Helpers
// ============================================================================

export function successResponse<T>(
  data: T,
  message?: string,
  meta?: ApiResponse['meta'],
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      meta,
    },
    { status }
  )
}

export function errorResponse(
  error: string,
  status = 500,
  details?: unknown
): NextResponse<ApiResponse> {
  console.error(`API Error [${status}]:`, error, details)
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}

export function notFoundResponse(resource: string): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404)
}

export function badRequestResponse(message: string): NextResponse<ApiResponse> {
  return errorResponse(message, 400)
}

export function unauthorizedResponse(message = "Unauthorized"): NextResponse<ApiResponse> {
  return errorResponse(message, 401)
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function validateUUID(id: string, resourceName: string): NextResponse<ApiResponse> | null {
  if (!id || !isValidUUID(id)) {
    return badRequestResponse(`Invalid ${resourceName} ID format`)
  }
  return null
}

export function parseQueryParams(searchParams: URLSearchParams): PaginationParams & ContentFilters {
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1')),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20'))),
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
    isPublished: searchParams.get('isPublished') === 'true' ? true : searchParams.get('isPublished') === 'false' ? false : undefined,
    search: searchParams.get('search') || undefined,
  }
}

// ============================================================================
// Database Client
// ============================================================================

export function getSupabaseClient() {
  try {
    return createClient()
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw new Error("Database connection failed")
  }
}

// ============================================================================
// Content Type Helpers
// ============================================================================

export type ContentType = 'slide' | 'video' | 'study-tool'

export function getContentTable(type: ContentType): string {
  const tables: Record<ContentType, string> = {
    'slide': 'slides',
    'video': 'videos',
    'study-tool': 'study_tools',
  }
  return tables[type]
}

export function getContentUrlField(type: ContentType): string {
  const fields: Record<ContentType, string> = {
    'slide': 'google_drive_url',
    'video': 'youtube_url',
    'study-tool': 'content_url',
  }
  return fields[type]
}

// ============================================================================
// Semester Queries
// ============================================================================

export interface Semester {
  id: string
  title: string
  description: string | null
  section: string
  has_midterm: boolean
  has_final: boolean
  start_date: string | null
  end_date: string | null
  default_credits: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SemesterWithCourses extends Semester {
  courses: Course[]
}

// ============================================================================
// Course Queries
// ============================================================================

export interface Course {
  id: string
  title: string
  course_code: string
  teacher_name: string
  teacher_email: string | null
  description: string | null
  credits: number
  semester_id: string | null
  is_active: boolean
  is_highlighted: boolean
  created_at: string
  updated_at: string
}

export interface CourseWithRelations extends Course {
  semester?: Semester
  topics?: Topic[]
  study_tools?: StudyTool[]
}

// ============================================================================
// Topic Queries
// ============================================================================

export interface Topic {
  id: string
  title: string
  description: string | null
  course_id: string | null
  order_index: number
  estimated_duration_minutes: number | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface TopicWithContent extends Topic {
  slides?: Slide[]
  videos?: Video[]
}

// ============================================================================
// Content Types
// ============================================================================

export interface Slide {
  id: string
  title: string
  description: string | null
  google_drive_url: string
  topic_id: string | null
  order_index: number
  file_size_mb: number | null
  slide_count: number | null
  is_downloadable: boolean
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  title: string
  description: string | null
  youtube_url: string
  topic_id: string | null
  order_index: number
  duration_minutes: number | null
  video_quality: '720p' | '1080p' | '4K' | null
  has_subtitles: boolean
  language: string
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface StudyTool {
  id: string
  title: string
  description: string | null
  type: 'previous_questions' | 'exam_note' | 'syllabus' | 'mark_distribution' | 'assignment' | 'lab_manual' | 'reference_book'
  content_url: string | null
  course_id: string | null
  exam_type: 'midterm' | 'final' | 'both' | 'assignment' | 'quiz'
  file_size_mb: number | null
  file_format: string | null
  academic_year: string | null
  is_downloadable: boolean
  download_count: number
  created_at: string
  updated_at: string
}

// ============================================================================
// Error Handler Wrapper
// ============================================================================

export async function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    return await handler()
  } catch (error) {
    console.error("API Error:", error)
    if (error instanceof Error) {
      return errorResponse(error.message, 500) as NextResponse<ApiResponse<T>>
    }
    return errorResponse("An unexpected error occurred", 500) as NextResponse<ApiResponse<T>>
  }
}
