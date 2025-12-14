/**
 * Simplified share utilities for basic functionality
 * URL Format: /semester-title/course-code/content-type/uuid
 * Supports both legacy UUID URLs and new semantic URLs
 */

import { 
  generateSemanticPath, 
  parseSemanticUrl, 
  isLegacyUrl,
  type ContentType 
} from './slug-utils'

// Content data structure for generating semantic URLs
interface ContentData {
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

/**
 * Generate a shareable URL for content
 * Format: /semester-title/course-code/content-type/uuid
 */
export function generateSimpleShareUrl(
  contentType: string, 
  contentId: string,
  contentData?: ContentData
): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  
  // If we have content data with semester/course info, generate semantic URL
  if (contentData) {
    const type = contentType === 'document' ? 'slide' : 
                 contentType === 'syllabus' ? 'study-tool' : contentType as ContentType
    const semanticPath = generateSemanticPath(type as ContentType, { 
      id: contentId,
      topic: contentData.topic,
      course: contentData.course,
    })
    return `${base}${semanticPath}`
  }
  
  // Fallback to legacy UUID URL
  switch (contentType) {
    case 'video':
      return `${base}/video/${contentId}`
    case 'slide':
    case 'document':
      return `${base}/slide/${contentId}`
    case 'study-tool':
    case 'syllabus':
      return `${base}/study-tool/${contentId}`
    default:
      return `${base}/slide/${contentId}`
  }
}

/**
 * Parse a share URL to extract content type and ID
 * Supports both legacy UUID URLs (/video/uuid) and semantic URLs (/semester/course/video/uuid)
 */
export function parseSimpleShareUrl(url: string): { type: string; id: string } | null {
  try {
    console.log("Parsing URL:", url)
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    // First, check for legacy UUID-based URLs (/video/uuid, /slide/uuid)
    if (isLegacyUrl(pathname)) {
      const pathParts = pathname.split('/').filter(Boolean)
      const [type, id] = pathParts
      console.log("Legacy URL - Type:", type, "ID:", id)
      return { type, id }
    }
    
    // Try parsing as semantic URL (/semester/course/video/uuid)
    const semanticResult = parseSemanticUrl(pathname)
    if (semanticResult) {
      console.log("Semantic URL - Type:", semanticResult.type, "ID:", semanticResult.id)
      return { 
        type: semanticResult.type, 
        id: semanticResult.id
      }
    }
    
    console.log("No valid shareable URL pattern found")
    return null
  } catch (error) {
    console.error('Error parsing URL:', error)
    return null
  }
}

export function updateUrlWithoutNavigation(url: string): void {
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', url)
  }
}
