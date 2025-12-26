"use client"

import React, { lazy, Suspense, memo, useEffect, useState, useRef, useCallback } from "react"
import { Loader2, Play, FileText } from "lucide-react"

// Lazy load the heavy ContentViewer component with preloading support
const ContentViewer = lazy(() => 
  import("./content-viewer").then(module => ({ default: module.ContentViewer }))
)

// Preload content viewer component when user is likely to need it
let contentViewerPreloaded = false
export const preloadContentViewer = () => {
  if (contentViewerPreloaded) return
  contentViewerPreloaded = true
  import("./content-viewer")
}

interface ContentItem {
  type: "slide" | "video" | "document" | "syllabus" | "study-tool"
  title: string
  url: string
  id: string
  topicTitle?: string
  courseTitle?: string
  description?: string
  courseCode?: string
  teacherName?: string
  semesterInfo?: {
    id: string
    title: string
    section: string
    is_active: boolean
  }
}

interface LazyContentViewerProps {
  content: ContentItem
  isLoading?: boolean
  priority?: boolean // If true, preload immediately
}

// Enhanced loading skeleton with content-type awareness
const ContentViewerSkeleton = memo(({ type, title }: { type?: string; title?: string }) => {
  const Icon = type === 'video' ? Play : FileText
  const bgColor = type === 'video' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
  const iconColor = type === 'video' ? 'text-red-400' : 'text-blue-400'
  
  return (
    <div className="h-full bg-white dark:bg-[#35374B] rounded-lg overflow-hidden shadow-lg">
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6">
          <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Loading {type || 'content'}...</p>
          </div>
          {title && (
            <p className="text-xs text-muted-foreground max-w-xs truncate">{title}</p>
          )}
          <div className="mt-4 w-48 mx-auto bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-full rounded-full animate-[loading_1.5s_ease-in-out_infinite]" 
              style={{ width: '60%' }} 
            />
          </div>
        </div>
      </div>
    </div>
  )
})

ContentViewerSkeleton.displayName = "ContentViewerSkeleton"

// Intersection Observer hook for viewport detection
const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, {
      threshold: 0.1,
      rootMargin: '100px', // Start loading when 100px away from viewport
      ...options
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, options])

  return isIntersecting
}

const LazyContentViewerComponent = function LazyContentViewer({ 
  content, 
  isLoading = false,
  priority = false
}: LazyContentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInViewport = useIntersectionObserver(containerRef)
  const [shouldRender, setShouldRender] = useState(priority)
  
  // Preload content viewer when hovering near or when priority is set
  useEffect(() => {
    if (priority) {
      preloadContentViewer()
      setShouldRender(true)
    }
  }, [priority])
  
  // Start rendering when in viewport
  useEffect(() => {
    if (isInViewport && !shouldRender) {
      preloadContentViewer()
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShouldRender(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isInViewport, shouldRender])
  
  // Preload on mouse enter for better perceived performance
  const handleMouseEnter = useCallback(() => {
    if (!shouldRender) {
      preloadContentViewer()
    }
  }, [shouldRender])
  
  return (
    <div 
      ref={containerRef} 
      className="h-full w-full"
      onMouseEnter={handleMouseEnter}
    >
      {shouldRender ? (
        <Suspense fallback={<ContentViewerSkeleton type={content.type} title={content.title} />}>
          <ContentViewer content={content} isLoading={isLoading} />
        </Suspense>
      ) : (
        <ContentViewerSkeleton type={content.type} title={content.title} />
      )}
    </div>
  )
}

export const LazyContentViewer = memo(LazyContentViewerComponent)
LazyContentViewer.displayName = "LazyContentViewer"

// Add loading animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes loading {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
  `
  if (!document.querySelector('[data-lazy-content-viewer-styles]')) {
    style.setAttribute('data-lazy-content-viewer-styles', 'true')
    document.head.appendChild(style)
  }
}
