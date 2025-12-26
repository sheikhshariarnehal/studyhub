"use client"

import { memo, useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Play, FileText, ExternalLink, Download, Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// ============================================================================
// TYPES
// ============================================================================

interface Video {
  id: string
  title: string
  youtube_url: string | null
  duration_minutes?: number
}

interface Slide {
  id: string
  title: string
  file_url: string
  file_size?: number
}

interface ContentItemCache {
  data: any
  timestamp: number
  thumbnail?: string
}

// ============================================================================
// CACHING SYSTEM WITH LRU EVICTION
// ============================================================================

// Content metadata cache with 10-minute TTL and max size
const MAX_CACHE_SIZE = 100
const contentCache = new Map<string, ContentItemCache>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Thumbnail cache with LRU eviction
const MAX_THUMBNAIL_CACHE = 50
const thumbnailCache = new Map<string, string>()
const thumbnailAccessOrder: string[] = []

// Check if cache is valid
const isCacheValid = (cacheItem: ContentItemCache | undefined): boolean => {
  if (!cacheItem) return false
  return Date.now() - cacheItem.timestamp < CACHE_TTL
}

// Get cached content
const getCachedContent = (id: string): ContentItemCache | null => {
  const cached = contentCache.get(id)
  if (cached && isCacheValid(cached)) {
    return cached
  }
  contentCache.delete(id)
  return null
}

// Set content cache with LRU eviction
const setCachedContent = (id: string, data: any, thumbnail?: string) => {
  // Evict oldest if at capacity
  if (contentCache.size >= MAX_CACHE_SIZE) {
    const firstKey = contentCache.keys().next().value
    if (firstKey) contentCache.delete(firstKey)
  }
  
  contentCache.set(id, {
    data,
    timestamp: Date.now(),
    thumbnail
  })
}

// Get cached thumbnail with LRU update
const getCachedThumbnail = (videoId: string): string | null => {
  const cached = thumbnailCache.get(videoId)
  if (cached) {
    // Move to end (most recently accessed)
    const index = thumbnailAccessOrder.indexOf(videoId)
    if (index > -1) {
      thumbnailAccessOrder.splice(index, 1)
      thumbnailAccessOrder.push(videoId)
    }
    return cached
  }
  return null
}

// Set thumbnail cache with LRU eviction
const setCachedThumbnail = (videoId: string, url: string) => {
  // Evict least recently used if at capacity
  if (thumbnailCache.size >= MAX_THUMBNAIL_CACHE && !thumbnailCache.has(videoId)) {
    const oldestKey = thumbnailAccessOrder.shift()
    if (oldestKey) thumbnailCache.delete(oldestKey)
  }
  
  thumbnailCache.set(videoId, url)
  if (!thumbnailAccessOrder.includes(videoId)) {
    thumbnailAccessOrder.push(videoId)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Extract YouTube video ID from URL
const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

// Get YouTube thumbnail URL
const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'mqdefault' | 'hqdefault' = 'mqdefault'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

// Get file extension and type
const getFileInfo = (url: string): { ext: string; type: string; icon: string } => {
  const ext = url.split('.').pop()?.toLowerCase() || ''
  
  if (ext === 'pdf') return { ext, type: 'PDF Document', icon: '📄' }
  if (['ppt', 'pptx'].includes(ext)) return { ext, type: 'PowerPoint', icon: '📊' }
  if (['doc', 'docx'].includes(ext)) return { ext, type: 'Word Document', icon: '📝' }
  if (['xls', 'xlsx'].includes(ext)) return { ext, type: 'Excel Spreadsheet', icon: '📈' }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { ext, type: 'Image', icon: '🖼️' }
  
  return { ext, type: 'File', icon: '📁' }
}

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Format duration
const formatDuration = (minutes?: number): string => {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// ============================================================================
// ENHANCED VIDEO ITEM WITH OPTIMIZATIONS
// ============================================================================

export const EnhancedVideoItem = memo(({ 
  video, 
  isSelected, 
  isMobile, 
  onSelect,
  showThumbnail = false,
  priority = false // If true, preload thumbnail immediately
}: {
  video: Video
  isSelected: boolean
  isMobile: boolean
  onSelect: () => void
  showThumbnail?: boolean
  priority?: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [prefetched, setPrefetched] = useState(false)
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>()
  const isMounted = useRef(true)

  // Extract video ID once using useMemo
  const videoId = useMemo(() => {
    if (!video.youtube_url) return null
    return extractYouTubeId(video.youtube_url)
  }, [video.youtube_url])

  // Check for cached thumbnail on mount
  useEffect(() => {
    isMounted.current = true
    
    if (videoId) {
      const cached = getCachedThumbnail(videoId)
      if (cached) {
        setThumbnail(cached)
        setPrefetched(true)
      } else if (priority && showThumbnail) {
        // Preload immediately if priority
        loadThumbnail(videoId)
      }
    }
    
    return () => {
      isMounted.current = false
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
    }
  }, [videoId, priority, showThumbnail])

  // Thumbnail loading function
  const loadThumbnail = useCallback((id: string) => {
    const thumbnailUrl = getYouTubeThumbnail(id, 'mqdefault')
    const img = new Image()
    img.onload = () => {
      if (isMounted.current) {
        setCachedThumbnail(id, thumbnailUrl)
        setThumbnail(thumbnailUrl)
        setPrefetched(true)
      }
    }
    img.onerror = () => {
      // Try lower quality if high quality fails
      const fallbackUrl = getYouTubeThumbnail(id, 'default')
      const fallbackImg = new Image()
      fallbackImg.onload = () => {
        if (isMounted.current) {
          setCachedThumbnail(id, fallbackUrl)
          setThumbnail(fallbackUrl)
          setPrefetched(true)
        }
      }
      fallbackImg.src = fallbackUrl
    }
    img.src = thumbnailUrl
  }, [])

  // Prefetch thumbnail on hover with debounce
  useEffect(() => {
    if (!isHovered || !videoId || prefetched || isMobile || !showThumbnail) return

    prefetchTimeoutRef.current = setTimeout(() => {
      loadThumbnail(videoId)
    }, 200) // 200ms debounce (reduced from 300ms)

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
    }
  }, [isHovered, videoId, prefetched, isMobile, showThumbnail, loadThumbnail])

  const handleMouseEnter = useCallback(() => {
    if (isMobile || isSelected) return
    setIsHovered(true)
  }, [isMobile, isSelected])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleClick = useCallback(() => {
    if (isLoading) return
    setIsLoading(true)
    // Optimistic UI update with requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
      onSelect()
      // Reset loading after a short delay
      setTimeout(() => {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }, 100)
    })
  }, [onSelect, isLoading])

  // Memoize button classes
  const buttonClasses = useMemo(() => {
    const base = `w-full justify-start text-left h-auto rounded-md group transition-all duration-150 touch-manipulation min-w-0 will-change-transform`
    const padding = isMobile ? 'px-2 py-2.5 min-h-[40px]' : 'px-2 py-2'
    const state = isSelected
      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm scale-[1.01]"
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground hover:scale-[1.02] active:scale-[0.98]"
    return `${base} ${padding} ${state}`
  }, [isMobile, isSelected])

  return (
    <Button
      variant="ghost"
      className={buttonClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={isLoading}
      aria-label={`Play video: ${video.title}`}
    >
      <div className="flex items-start gap-2.5 w-full min-w-0">
        {/* Icon/Thumbnail */}
        <div className={`relative flex-shrink-0 ${isHovered && !isSelected ? 'animate-pulse' : ''}`}>
          {showThumbnail && thumbnail && !isLoading ? (
            <div className="w-12 h-9 rounded overflow-hidden">
              <img 
                src={thumbnail} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <Play 
              className={`h-3.5 w-3.5 mt-0.5 transition-all duration-200 ${
                isSelected 
                  ? "text-red-500 fill-red-500/20" 
                  : isHovered 
                    ? "text-red-500 fill-red-500/10" 
                    : "text-red-400"
              } ${isLoading ? 'animate-spin' : ''}`} 
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span 
            className={`text-xs ${isMobile ? 'text-sm' : 'text-xs'} leading-relaxed break-words min-w-0 transition-colors duration-200 ${
              isSelected ? "font-medium text-foreground" : ""
            }`}
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              hyphens: 'auto'
            }}
          >
            {video.title}
          </span>
          
          {/* Duration badge */}
          {video.duration_minutes && (
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {formatDuration(video.duration_minutes)}
            </span>
          )}
        </div>

        {/* Hover info */}
        {isHovered && !isSelected && !isMobile && (
          <div className="flex items-center gap-1 flex-shrink-0 animate-in fade-in duration-200">
            <span className="text-[10px] text-muted-foreground font-medium">Video</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
    </Button>
  )
})

EnhancedVideoItem.displayName = "EnhancedVideoItem"

// ============================================================================
// ENHANCED SLIDE ITEM WITH OPTIMIZATIONS
// ============================================================================

export const EnhancedSlideItem = memo(({ 
  slide, 
  isSelected, 
  isMobile, 
  onSelect,
  showFileInfo = true,
  priority = false
}: {
  slide: Slide
  isSelected: boolean
  isMobile: boolean
  onSelect: () => void
  showFileInfo?: boolean
  priority?: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [prefetched, setPrefetched] = useState(false)
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>()
  const isMounted = useRef(true)

  // Memoize file info
  const fileInfo = useMemo(() => getFileInfo(slide.file_url), [slide.file_url])

  // Check cache on mount
  useEffect(() => {
    isMounted.current = true
    
    const cached = getCachedContent(slide.id)
    if (cached) {
      setPrefetched(true)
    } else if (priority) {
      // Prefetch immediately if priority
      prefetchFile()
    }
    
    return () => {
      isMounted.current = false
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
    }
  }, [slide.id, priority])

  // File prefetch function
  const prefetchFile = useCallback(() => {
    if (prefetched) return
    
    // HEAD request for validation without downloading full file
    fetch(slide.file_url, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        if (isMounted.current) {
          setCachedContent(slide.id, { prefetched: true, url: slide.file_url })
          setPrefetched(true)
        }
      })
      .catch(() => {
        // Silent fail - file will load on demand
      })
  }, [slide.id, slide.file_url, prefetched])

  // Prefetch file on hover
  useEffect(() => {
    if (!isHovered || prefetched || isMobile) return

    prefetchTimeoutRef.current = setTimeout(prefetchFile, 200)

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
    }
  }, [isHovered, prefetched, isMobile, prefetchFile])

  const handleMouseEnter = useCallback(() => {
    if (isMobile || isSelected) return
    setIsHovered(true)
  }, [isMobile, isSelected])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleClick = useCallback(() => {
    if (isLoading) return
    setIsLoading(true)
    requestAnimationFrame(() => {
      onSelect()
      setTimeout(() => {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }, 100)
    })
  }, [onSelect, isLoading])

  // Memoize button classes
  const buttonClasses = useMemo(() => {
    const base = `w-full justify-start text-left h-auto rounded-md group transition-all duration-150 touch-manipulation min-w-0 will-change-transform`
    const padding = isMobile ? 'px-2 py-2.5 min-h-[40px]' : 'px-2 py-2'
    const state = isSelected
      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm scale-[1.01]"
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground hover:scale-[1.02] active:scale-[0.98]"
    return `${base} ${padding} ${state}`
  }, [isMobile, isSelected])

  return (
    <Button
      variant="ghost"
      className={buttonClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={isLoading}
      aria-label={`Open slide: ${slide.title}`}
    >
      <div className="flex items-start gap-2.5 w-full min-w-0">
        {/* Icon */}
        <div className={`relative flex-shrink-0 ${isHovered && !isSelected ? 'animate-pulse' : ''}`}>
          <FileText 
            className={`h-3.5 w-3.5 mt-0.5 transition-all duration-150 ${
              isSelected 
                ? "text-blue-500 fill-blue-500/20" 
                : isHovered 
                  ? "text-blue-500 fill-blue-500/10" 
                  : "text-blue-400"
            } ${isLoading ? 'animate-pulse' : ''}`} 
          />
          {prefetched && !isSelected && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full" title="Preloaded" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span 
            className={`text-xs ${isMobile ? 'text-sm' : 'text-xs'} leading-relaxed break-words min-w-0 transition-colors duration-200 ${
              isSelected ? "font-medium text-foreground" : ""
            }`}
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              hyphens: 'auto'
            }}
          >
            {slide.title}
          </span>
          
          {/* File size badge */}
          {showFileInfo && slide.file_size && (
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {formatFileSize(slide.file_size)}
            </span>
          )}
        </div>

        {/* Hover info */}
        {isHovered && !isSelected && !isMobile && (
          <div className="flex items-center gap-1.5 flex-shrink-0 animate-in fade-in duration-200">
            <span className="text-[10px] text-muted-foreground font-medium">
              {fileInfo.type}
            </span>
            <Download className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
    </Button>
  )
})

EnhancedSlideItem.displayName = "EnhancedSlideItem"

// ============================================================================
// SKELETON LOADERS
// ============================================================================

export const VideoItemSkeleton = memo(({ isMobile }: { isMobile?: boolean }) => (
  <div className={`w-full ${isMobile ? 'px-2 py-2.5' : 'px-2 py-2'} flex items-start gap-2.5`}>
    <Skeleton className="h-3.5 w-3.5 rounded flex-shrink-0 mt-0.5" />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-3 w-[85%]" />
      <Skeleton className="h-2 w-12" />
    </div>
  </div>
))

VideoItemSkeleton.displayName = "VideoItemSkeleton"

export const SlideItemSkeleton = memo(({ isMobile }: { isMobile?: boolean }) => (
  <div className={`w-full ${isMobile ? 'px-2 py-2.5' : 'px-2 py-2'} flex items-start gap-2.5`}>
    <Skeleton className="h-3.5 w-3.5 rounded flex-shrink-0 mt-0.5" />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-3 w-[90%]" />
      <Skeleton className="h-2 w-16" />
    </div>
  </div>
))

SlideItemSkeleton.displayName = "SlideItemSkeleton"

// ============================================================================
// CACHE UTILITIES (Export for external use)
// ============================================================================

export const contentCacheUtils = {
  // Clear all caches
  clearAll: () => {
    contentCache.clear()
    thumbnailCache.clear()
    thumbnailAccessOrder.length = 0
  },
  
  // Clear specific item
  clearItem: (id: string) => {
    contentCache.delete(id)
  },
  
  // Clear thumbnail cache
  clearThumbnails: () => {
    thumbnailCache.clear()
    thumbnailAccessOrder.length = 0
  },
  
  // Get cache stats
  getStats: () => ({
    contentCacheSize: contentCache.size,
    thumbnailCacheSize: thumbnailCache.size,
    totalSize: contentCache.size + thumbnailCache.size,
    maxContentCache: MAX_CACHE_SIZE,
    maxThumbnailCache: MAX_THUMBNAIL_CACHE
  }),
  
  // Preload thumbnails for videos (batch)
  preloadThumbnails: async (videos: Video[], concurrency = 3) => {
    const videosToLoad = videos.filter(video => {
      if (!video.youtube_url) return false
      const videoId = extractYouTubeId(video.youtube_url)
      return videoId && !getCachedThumbnail(videoId)
    })
    
    // Load in batches for better performance
    const batches: Video[][] = []
    for (let i = 0; i < videosToLoad.length; i += concurrency) {
      batches.push(videosToLoad.slice(i, i + concurrency))
    }
    
    for (const batch of batches) {
      await Promise.all(batch.map(video => {
        const videoId = extractYouTubeId(video.youtube_url!)
        if (!videoId) return Promise.resolve()
        
        return new Promise<void>((resolve) => {
          const thumbnailUrl = getYouTubeThumbnail(videoId)
          const img = new Image()
          img.onload = () => {
            setCachedThumbnail(videoId, thumbnailUrl)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = thumbnailUrl
        })
      }))
    }
  },
  
  // Prefetch slides (batch with rate limiting)
  prefetchSlides: async (slides: Slide[], concurrency = 2) => {
    const slidesToLoad = slides.filter(slide => !getCachedContent(slide.id))
    
    const batches: Slide[][] = []
    for (let i = 0; i < slidesToLoad.length; i += concurrency) {
      batches.push(slidesToLoad.slice(i, i + concurrency))
    }
    
    for (const batch of batches) {
      await Promise.all(batch.map(slide => 
        fetch(slide.file_url, { method: 'HEAD', mode: 'no-cors' })
          .then(() => setCachedContent(slide.id, { prefetched: true, url: slide.file_url }))
          .catch(() => {})
      ))
    }
  },
  
  // Preload next content items (smart preloading)
  preloadNext: async (videos: Video[], slides: Slide[], count = 3) => {
    const videosToPreload = videos.slice(0, count)
    const slidesToPreload = slides.slice(0, count)
    
    await Promise.all([
      contentCacheUtils.preloadThumbnails(videosToPreload, 2),
      contentCacheUtils.prefetchSlides(slidesToPreload, 2)
    ])
  }
}
