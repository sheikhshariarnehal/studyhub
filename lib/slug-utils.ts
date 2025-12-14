/**
 * Slug utilities for generating semantic URLs
 * Format: /semester-title/course-code/content-type/uuid
 */

/**
 * Convert a string to a URL-safe slug
 */
export function toSlug(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    // Remove emojis and special unicode characters
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
}

/**
 * Generate a semester slug from title
 */
export function generateSemesterSlug(title: string): string {
  return toSlug(title)
}

/**
 * Content types for URL routing
 */
export type ContentType = 'video' | 'slide' | 'study-tool'

/**
 * Generate a semantic URL path for content
 * Format: /semester-title/course-code/content-type/uuid
 */
export function generateSemanticPath(
  contentType: ContentType,
  content: {
    id: string
    topic?: {
      course?: {
        course_code?: string | null
        semester?: {
          title: string
        } | null
      } | null
    } | null
    course?: {
      course_code?: string | null
      semester?: {
        title: string
      } | null
    } | null
  }
): string {
  // For study tools, they link directly to course (no topic)
  const course = content.topic?.course || content.course
  const semester = course?.semester

  // Build path segments
  const segments: string[] = []

  // Semester segment
  if (semester?.title) {
    segments.push(toSlug(semester.title))
  } else {
    segments.push('content')
  }

  // Course code segment
  if (course?.course_code) {
    segments.push(toSlug(course.course_code))
  } else {
    segments.push('course')
  }

  // Content type
  segments.push(contentType)

  // Content ID (full UUID)
  segments.push(content.id)

  return '/' + segments.join('/')
}

/**
 * Parse a semantic URL to extract content info
 * Format: /semester-title/course-code/content-type/uuid
 */
export function parseSemanticUrl(pathname: string): { type: ContentType; id: string } | null {
  const segments = pathname.split('/').filter(Boolean)
  
  // Need at least 4 segments: semester/course/type/id
  if (segments.length < 4) return null
  
  // Get type and id from last two segments
  const contentType = segments[segments.length - 2]
  const id = segments[segments.length - 1]
  
  // Validate content type
  if (!['video', 'slide', 'study-tool'].includes(contentType)) {
    return null
  }
  
  // Validate UUID format
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  if (!uuidRegex.test(id)) {
    return null
  }
  
  return { type: contentType as ContentType, id }
}

/**
 * Check if a URL is a legacy UUID-based URL (e.g., /video/uuid)
 */
export function isLegacyUrl(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 2) return false
  
  const [type, id] = segments
  const validTypes = ['video', 'slide', 'study-tool']
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  
  return validTypes.includes(type) && uuidRegex.test(id)
}
