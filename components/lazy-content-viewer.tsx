"use client"

import React, { lazy, Suspense, memo } from "react"
import { Loader2 } from "lucide-react"

// Lazy load the heavy ContentViewer component
const ContentViewer = lazy(() => 
  import("./content-viewer").then(module => ({ default: module.ContentViewer }))
)

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
}

// Loading skeleton component
const ContentViewerSkeleton = memo(() => (
  <div className="h-full bg-white dark:bg-[#35374B] rounded-lg overflow-hidden shadow-lg animate-pulse">
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading content viewer...</p>
      </div>
    </div>
  </div>
))

ContentViewerSkeleton.displayName = "ContentViewerSkeleton"

const LazyContentViewerComponent = function LazyContentViewer({ 
  content, 
  isLoading = false 
}: LazyContentViewerProps) {
  return (
    <Suspense fallback={<ContentViewerSkeleton />}>
      <ContentViewer content={content} isLoading={isLoading} />
    </Suspense>
  )
}

export const LazyContentViewer = memo(LazyContentViewerComponent)
LazyContentViewer.displayName = "LazyContentViewer"
