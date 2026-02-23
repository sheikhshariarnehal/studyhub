/**
 * Utility functions for generating shareable URLs and handling URL parsing
 */

export interface ShareableContent {
  id: string
  type: 'video' | 'slide' | 'study-tool'
  title: string
  url: string
  description?: string
  courseTitle?: string
  topicTitle?: string
  teacherName?: string
  semesterTitle?: string
}

export interface ShareMetadata {
  title: string
  description: string
  shareUrl: string
  embedUrl: string
  type: string
}

/**
 * Generate a shareable URL for any content type
 */
export function generateShareUrl(contentType: string, contentId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '')
  
  const routeMap: Record<string, string> = {
    'video': '/video',
    'slide': '/slide', 
    'study-tool': '/study-tool',
    'document': '/slide', // Fallback for documents
    'syllabus': '/study-tool' // Fallback for syllabus
  }
  
  const route = routeMap[contentType] || '/slide'
  return `${base}${route}/${contentId}`
}

/**
 * Generate share metadata for social media and SEO
 */
export function generateShareMetadata(content: ShareableContent): ShareMetadata {
  const shareUrl = generateShareUrl(content.type, content.id)
  
  const titleSuffix = content.courseTitle ? ` - ${content.courseTitle}` : ''
  const title = `${content.title}${titleSuffix}`
  
  let description = content.description || ''
  if (!description) {
    switch (content.type) {
      case 'video':
        description = `Watch ${content.title}${content.courseTitle ? ` from ${content.courseTitle} course` : ''}`
        break
      case 'slide':
        description = `View ${content.title} slides${content.courseTitle ? ` from ${content.courseTitle} course` : ''}`
        break
      case 'study-tool':
        description = `Access study materials for ${content.courseTitle || content.title}`
        break
      default:
        description = `View ${content.title}`
    }
  }
  
  return {
    title,
    description,
    shareUrl,
    embedUrl: content.url,
    type: content.type
  }
}

/**
 * Parse content type and ID from a shareable URL
 */
export function parseShareUrl(url: string): { type: string; id: string } | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    if (pathParts.length >= 2) {
      const [type, id] = pathParts
      
      // Map route names to content types
      const typeMap: Record<string, string> = {
        'video': 'video',
        'slide': 'slide',
        'study-tool': 'study-tool'
      }
      
      const contentType = typeMap[type]
      if (contentType && id) {
        return { type: contentType, id }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error parsing share URL:', error)
    return null
  }
}

/**
 * Generate embed URL for different content types
 */
export function generateEmbedUrl(contentType: string, originalUrl: string): string {
  switch (contentType) {
    case 'video':
      // Convert YouTube URLs to embed format
      const videoId = originalUrl.match(/(?:embed\/|v=|youtu\.be\/)([^?&]+)/)?.[1]
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
      return originalUrl
      
    case 'slide':
    case 'study-tool':
      // Convert Google Drive URLs to embed format
      const fileId = originalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`
      }
      // For direct file URLs (e.g. DigitalOcean Spaces, S3, CDN-hosted PDFs),
      // use Google Docs Viewer so Chrome does not block the iframe embed.
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(originalUrl)}&embedded=true`
      }
      return originalUrl
      
    default:
      return originalUrl
  }
}

/**
 * Generate download URL for different content types
 */
export function generateDownloadUrl(contentType: string, originalUrl: string): string {
  switch (contentType) {
    case 'video':
      // For YouTube videos, return the watch URL
      const videoId = originalUrl.match(/(?:embed\/|v=|youtu\.be\/)([^?&]+)/)?.[1]
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`
      }
      return originalUrl
      
    case 'slide':
    case 'study-tool':
      // For Google Drive files, return the download URL
      const fileId = originalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`
      }
      return originalUrl
      
    default:
      return originalUrl
  }
}

/**
 * Check if a URL is shareable (has proper format)
 */
export function isShareableUrl(url: string): boolean {
  try {
    const parsed = parseShareUrl(url)
    return parsed !== null
  } catch {
    return false
  }
}

/**
 * Generate QR code URL for sharing
 */
export function generateQRCodeUrl(shareUrl: string, size: number = 200): string {
  const encodedUrl = encodeURIComponent(shareUrl)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`
}

/**
 * Generate social media sharing URLs
 */
export function generateSocialShareUrls(metadata: ShareMetadata) {
  const encodedUrl = encodeURIComponent(metadata.shareUrl)
  const encodedTitle = encodeURIComponent(metadata.title)
  const encodedDescription = encodeURIComponent(metadata.description)
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodeURIComponent(`Check out: ${metadata.title}`)}&body=${encodedDescription}%0A%0A${encodedUrl}`
  }
}

/**
 * Validate content ID format (UUID)
 */
export function isValidContentId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Get content type display name
 */
export function getContentTypeDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    'video': 'Video',
    'slide': 'Slide',
    'study-tool': 'Study Tool',
    'document': 'Document',
    'syllabus': 'Syllabus'
  }
  
  return displayNames[type] || 'Content'
}
