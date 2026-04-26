"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Download, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LazyContentViewer } from "@/components/lazy-content-viewer"
import { useOptimizedContent } from "@/hooks/use-optimized-content"
import { performanceMonitor, measureAsync } from "@/lib/performance"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useIsMobile } from "@/components/ui/use-mobile"

import { trackContentEvent, trackDownloadEvent, trackError } from "@/lib/analytics"
import { generateSimpleShareUrl, parseSimpleShareUrl, updateUrlWithoutNavigation } from "@/lib/simple-share-utils"

// Lazy-load heavy components to reduce initial JS bundle
const FunctionalSidebar = dynamic(
  () => import("@/components/functional-sidebar").then(mod => ({ default: mod.FunctionalSidebar })),
  { ssr: false }
)
const Header = dynamic(
  () => import("@/components/header").then(mod => ({ default: mod.Header })),
  { ssr: false }
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
  courseId?: string
  topicId?: string
  teacherName?: string
  semesterInfo?: {
    id: string
    title: string
    section: string
    is_active: boolean
  }
}

export default function HomePage() {
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const router = useRouter()

  // Fallback loading state for compatibility
  const [fallbackLoading, setFallbackLoading] = useState(false)

  // Use optimized content loading
  const {
    content: optimizedContent,
    isLoading: optimizedLoading,
    loadContent,
    clearContent,
    cacheStats
  } = useOptimizedContent({
    cacheStrategy: 'normal',
    enablePrefetch: true,
    preloadNext: true
  })

  // Use optimized loading or fallback
  const isLoading = optimizedLoading || fallbackLoading

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load content if URL contains shareable route
  useEffect(() => {
    const loadContentFromUrl = async () => {
      if (!mounted) return

      // Skip if content is already selected (to avoid conflicts)
      if (selectedContent) return

      // Check for share_path parameter (from middleware rewrite)
      const urlParams = new URLSearchParams(window.location.search)
      const sharePath = urlParams.get('share_path')

      console.log("URL Params:", urlParams.toString())
      console.log("Share path from params:", sharePath)
      console.log("Window location:", window.location.href)
      console.log("Window pathname:", window.location.pathname)

      let urlToCheck = window.location.href
      if (sharePath) {
        // Use the original shareable path
        urlToCheck = `${window.location.origin}${sharePath}`
        console.log("Using share path:", urlToCheck)
      }

      console.log("Final URL to check:", urlToCheck)

      const parsedUrl = parseSimpleShareUrl(urlToCheck)
      console.log("Parsed URL:", parsedUrl)

      if (parsedUrl) {
        try {
          setFallbackLoading(true)

          let apiEndpoint: string
          let contentData: any

          // Use simplified endpoints - both semantic and legacy URLs now use full UUID
          await loadContent(parsedUrl.type, parsedUrl.id)

          if (parsedUrl.type === 'slide') {
            apiEndpoint = `/api/slides-simple/${parsedUrl.id}`
          } else if (parsedUrl.type === 'video') {
            apiEndpoint = `/api/videos-simple/${parsedUrl.id}`
          } else if (parsedUrl.type === 'study-tool') {
            apiEndpoint = `/api/study-tools-simple/${parsedUrl.id}`
          } else {
            // syllabus, document, etc. are all study-tool subtypes
            apiEndpoint = `/api/study-tools-simple/${parsedUrl.id}`
          }
          console.log("API Endpoint:", apiEndpoint)

          const response = await fetch(apiEndpoint)
          console.log("API Response status:", response.status)

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }
          contentData = await response.json()

          console.log("Content Data:", contentData)

          if (!contentData || !contentData.id) {
            console.error("Invalid content data received:", contentData)
            throw new Error("Invalid content data received from API")
          }

          // Convert API response to ContentItem format
          const content: ContentItem = {
            id: contentData.id,
            type: parsedUrl.type === 'study-tool' ?
                  (contentData.studyToolType === 'syllabus' ? 'syllabus' : 'study-tool') :
                  parsedUrl.type as "slide" | "video",
            title: contentData.title,
            url: contentData.url || `#study-tool-${contentData.id}`,
            topicTitle: parsedUrl.type === 'study-tool' ? undefined : contentData.topic?.title,
            courseTitle: parsedUrl.type === 'study-tool' ?
                  contentData.course?.title :
                  (contentData.topic?.course?.title || contentData.course?.title),
            description: contentData.description,
            courseCode: parsedUrl.type === 'study-tool' ? contentData.course?.course_code : undefined,
            courseId: parsedUrl.type === 'study-tool'
              ? contentData.course?.id
              : (contentData.topic?.course?.id || contentData.course?.id),
            topicId: parsedUrl.type === 'study-tool' ? undefined : contentData.topic?.id,
            // Include semester info for sidebar auto-selection
            semesterInfo: contentData.semesterInfo || contentData.course?.semester || contentData.topic?.course?.semester,
          }

          console.log("Setting content:", content)
          setSelectedContent(content)

          // Update the browser URL to show semantic shareable URL
          // Build content data for semantic URL generation
          const urlContentData = {
            id: contentData.id,
            title: contentData.title,
            topic: contentData.topic,
            course: contentData.course,
          }
          const shareUrl = generateSimpleShareUrl(parsedUrl.type, contentData.id, urlContentData)
          updateUrlWithoutNavigation(shareUrl)

          // Removed toast notification - no popup when content loads
        } catch (error: any) {
          console.error("Error loading content from URL:", error)
          
          // Handle 404 errors
          if (error.message?.includes('404')) {
            console.log("Content not found, redirecting to browse page")
            toast({
              title: "Content Not Found",
              description: "The requested content could not be found. Redirecting to browse available content...",
              variant: "destructive",
            })

            // Redirect to appropriate browse page based on content type
            setTimeout(() => {
              if (parsedUrl.type === 'slide') {
                window.location.href = '/browse-slides'
              } else if (parsedUrl.type === 'video') {
                window.location.href = '/browse-videos'
              } else {
                window.location.href = '/test-api'
              }
            }, 2000)
          } else {
            toast({
              title: "Error",
              description: "Failed to load content from URL",
              variant: "destructive",
            })
          }
        } finally {
          setFallbackLoading(false)
        }
      } else {
        console.log("No shareable URL detected")
      }
    }

    // Add a small delay to ensure everything is mounted
    const timer = setTimeout(loadContentFromUrl, 100)
    return () => clearTimeout(timer)
  }, [mounted, selectedContent, toast, loadContent, setFallbackLoading])

  // Initialize with featured course content (prioritizes syllabus, fallback to other content) if available (only if no shareable URL)
  useEffect(() => {
    const initializeHighlightedContent = async () => {
      // Skip if content is already selected (from shareable URL)
      if (selectedContent) {
        console.log("Skipping default content load - content already selected")
        return
      }

      // Check if we're processing a shareable URL
      const urlParams = new URLSearchParams(window.location.search)
      const sharePath = urlParams.get('share_path')
      const currentUrl = window.location.href
      const hasShareableUrl = sharePath ||
        /\/(video|slide|study-tool)\/[a-f0-9-]{36}/i.test(currentUrl)

      if (hasShareableUrl) {
        console.log("Skipping default content load - shareable URL detected")
        return
      }

      try {
        setFallbackLoading(true)

        // First try to load content from highlighted/featured course (prioritizes syllabus, then other content)
        const highlightedResponse = await fetch("/api/content/highlighted-syllabus")
        if (highlightedResponse.ok) {
          const highlightedContent = await highlightedResponse.json()
          if (highlightedContent) {
            setSelectedContent(highlightedContent)
            
            return
          }
        } else if (highlightedResponse.status === 404) {
          console.log("No highlighted course content found, falling back to default content")
        }

        // Fallback to default content if no highlighted course content
        const defaultResponse = await fetch("/api/content/default")
        if (defaultResponse.ok) {
          const defaultContent = await defaultResponse.json()
          if (defaultContent) {
            setSelectedContent(defaultContent)
          }
        }
      } catch (error) {
        console.error("Failed to load initial content:", error)
        toast({
          title: "Loading Error",
          description: "Failed to load initial content",
          variant: "destructive",
        })
      } finally {
        setFallbackLoading(false)
      }
    }

    if (mounted) {
      // Add a delay to ensure shareable URL processing happens first
      const timer = setTimeout(initializeHighlightedContent, 300)
      return () => clearTimeout(timer)
    }
  }, [mounted, selectedContent, toast, setFallbackLoading])

  // Mobile layout doesn't need sidebar state management

  const handleContentSelect = async (content: ContentItem) => {
    console.log("=== OPTIMIZED CONTENT SELECTION ===")
    console.log("Selected content:", content)
    console.log("Content type:", content.type)
    console.log("Content ID:", content.id)

    try {
      // Use optimized content loading with performance tracking
      await measureAsync('content-load', async () => {
        await loadContent(content.type, content.id)
      })

      // Log content access for analytics (both internal and Vercel Analytics)
      await trackContentEvent({
        contentId: content.id,
        contentType: content.type === "document" ? "slide" : content.type as any,
        action: "view",
        metadata: {
          title: content.title,
          topicTitle: content.topicTitle,
          courseTitle: content.courseTitle,
          cacheHitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0
        },
      })

      // Set the selected content to display in the viewer
      console.log("Setting selected content...")
      setSelectedContent(content)

      // Generate shareable URL and update the browser URL without navigation
      const contentType = content.type === "document" ? "slide" :
                         content.type === "syllabus" ? "study-tool" : content.type
      
      // Build content data structure for semantic URL generation
      // Format: /semester-title/course-code/content-type/uuid
      const urlContentData = {
        id: content.id,
        topic: content.topicTitle ? {
          course: content.courseTitle ? {
            course_code: content.courseCode || null,
            semester: content.semesterInfo ? {
              title: content.semesterInfo.title,
            } : null,
          } : null,
        } : null,
        // For study-tools that link directly to course
        course: content.type === 'study-tool' || content.type === 'syllabus' ? {
          course_code: content.courseCode || null,
          semester: content.semesterInfo ? {
            title: content.semesterInfo.title,
          } : null,
        } : null,
      }
      
      const shareUrl = generateSimpleShareUrl(contentType, content.id, urlContentData)

      console.log("Generated share URL:", shareUrl)
      console.log("Updating browser URL...")

      // Update URL without navigation (replace current history entry)
      updateUrlWithoutNavigation(shareUrl)

      console.log("URL updated successfully")

      // Removed toast notification - no popup when content loads
    } catch (error) {
      console.error("Error loading content:", error)
      trackError("Content loading failed", {
        contentId: content.id,
        contentType: content.type,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      toast({
        title: "Error",
        description: "Failed to load content. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Loading state is handled by the optimized content hook
    }
  }

  const handleDownload = async () => {
    if (!selectedContent) return

    try {
      if (selectedContent.type === "video") {
        // For YouTube videos, open the video page
        const videoId =
          selectedContent.url.match(/embed\/([^?]+)/)?.[1] ||
          selectedContent.url.match(/v=([^&]+)/)?.[1] ||
          selectedContent.url.match(/youtu\.be\/([^?]+)/)?.[1]
        if (videoId) {
          window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank")
        } else {
          window.open(selectedContent.url, "_blank")
        }
      } else {
        // For Google Drive files, trigger download
        const fileId = selectedContent.url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
        if (fileId) {
          window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, "_blank")
        } else {
          window.open(selectedContent.url, "_blank")
        }
      }

      // Log download action (both internal and Vercel Analytics)
      await trackDownloadEvent({
        contentId: selectedContent.id,
        contentType: selectedContent.type === "document" ? "slide" :
                    selectedContent.type === "syllabus" ? "study-tool" : selectedContent.type as any,
        metadata: {
          title: selectedContent.title,
          topicTitle: selectedContent.topicTitle,
          courseTitle: selectedContent.courseTitle,
        },
      })

      toast({
        title: "Download Started",
        description: `Opening ${selectedContent.title}`,
      })
    } catch (error) {
      console.error("Download error:", error)
      trackError("Download failed", {
        contentId: selectedContent.id,
        contentType: selectedContent.type,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      toast({
        title: "Download Failed",
        description: "Unable to download content. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFullscreen = () => {
    if (!selectedContent) return

    try {
      if (selectedContent.type === "video") {
        // For videos, open YouTube in new tab
        const videoId =
          selectedContent.url.match(/embed\/([^?]+)/)?.[1] ||
          selectedContent.url.match(/v=([^&]+)/)?.[1] ||
          selectedContent.url.match(/youtu\.be\/([^?]+)/)?.[1]
        if (videoId) {
          window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank")
        } else {
          window.open(selectedContent.url, "_blank")
        }
      } else {
        const iframe = document.querySelector("iframe")
        if (iframe && iframe.requestFullscreen) {
          iframe.requestFullscreen()
        } else {
          window.open(selectedContent.url, "_blank")
        }
      }

      toast({
        title: "Fullscreen Mode",
        description: "Content opened in fullscreen",
      })
    } catch (error) {
      console.error("Fullscreen error:", error)
      toast({
        title: "Fullscreen Failed",
        description: "Unable to open in fullscreen mode",
        variant: "destructive",
      })
    }
  }



  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className={`${isMobile ? 'flex flex-col h-[calc(100vh-3.5rem)]' : 'flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-hidden'}`}>
        {/* Mobile Layout: Content at top, sidebar below */}
        {isMobile ? (
          <>
            {/* Content Area - Mobile (YouTube-like aspect ratio) */}
            <div className="flex-none bg-background">
              {selectedContent ? (
                <>
                  {/* Content Viewer - Clean Mobile Design */}
                  <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                    <div className="absolute inset-0 overflow-hidden bg-black">
                      <LazyContentViewer content={selectedContent} isLoading={isLoading} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 bg-background">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-muted-foreground font-semibold text-xl">DIU</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Select content from courses below
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Functional Sidebar - Mobile (below content) */}
            <div className="flex-1 bg-card border-t border-border overflow-hidden">
              <FunctionalSidebar
                onContentSelect={handleContentSelect}
                selectedContentId={selectedContent?.id}
                selectedContentType={selectedContent?.type}
                selectedCourseId={selectedContent?.courseId}
                selectedTopicId={selectedContent?.topicId}
                initialSemesterId={selectedContent?.semesterInfo?.id}
              />
            </div>
          </>
        ) : (
          /* Desktop Layout: Side-by-side */
          <>
            {/* Content Area - Desktop */}
            <div className="flex-1 flex flex-col bg-background min-w-0 relative">
              {selectedContent ? (
                <>
                  {/* Content Viewer - Desktop */}
                  <div className="flex-1 p-0.5 sm:p-1 md:p-3 lg:p-4 xl:p-6 overflow-hidden">
                    <div className="h-full rounded-md sm:rounded-lg md:rounded-xl overflow-hidden shadow-md sm:shadow-lg md:shadow-modern-lg border border-border animate-fade-in">
                      <LazyContentViewer content={selectedContent} isLoading={isLoading} />
                    </div>
                  </div>

                  {/* Bottom Controls - Desktop */}
                  <div className="bg-card/95 backdrop-blur-sm px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-t border-border/50 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                      {/* Content Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0 flex-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs font-medium w-fit ${
                            selectedContent.type === "video"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : selectedContent.type === "slide"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {selectedContent.type === "slide"
                            ? "Slide Presentation"
                            : selectedContent.type === "video"
                              ? "Video Content"
                              : "Document"}
                        </Badge>
                        {selectedContent.courseTitle && (
                          <span className="text-muted-foreground text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">
                            {selectedContent.courseTitle}
                            {selectedContent.topicTitle && ` • ${selectedContent.topicTitle}`}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons - Desktop */}
                      {/* For videos: no buttons shown */}
                      {/* For files (slides/documents): only download button */}
                      {selectedContent.type !== "video" && (
                        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9 touch-manipulation min-w-0"
                            disabled={isLoading}
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="hidden xs:inline truncate">Download</span>
                            <span className="xs:hidden">Download</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full p-4 sm:p-6 lg:p-8">
                  <div className="text-center max-w-sm sm:max-w-md lg:max-w-lg animate-slide-up">
                    {/* Logo */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-6 transform hover:scale-105 transition-transform duration-300">
                      <img 
                        src="/images/favicon2.webp" 
                        alt="StudyHub DIU Logo" 
                        className="w-full h-full object-contain rounded-xl" 
                      />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent mb-4 leading-tight">
                      Welcome to DIU CSE Learning Platform
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6 text-sm sm:text-base lg:text-lg leading-relaxed">
                      Access your course materials, watch video lectures, and study with interactive content
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-xs sm:text-sm">
                      <div className="flex flex-col items-center p-3 bg-card/50 rounded-lg border border-border/50">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                          <span className="text-blue-600 dark:text-blue-400 text-sm">📊</span>
                        </div>
                        <span className="text-muted-foreground">Slides</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-card/50 rounded-lg border border-border/50">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                          <span className="text-red-600 dark:text-red-400 text-sm">🎥</span>
                        </div>
                        <span className="text-muted-foreground">Videos</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-card/50 rounded-lg border border-border/50">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                          <span className="text-green-600 dark:text-green-400 text-sm">📚</span>
                        </div>
                        <span className="text-muted-foreground">Documents</span>
                      </div>
                    </div>

                    {/* Desktop hint */}
                    <div className="text-xs text-muted-foreground/70 mt-4">
                      Use the sidebar to navigate through semesters and courses
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Desktop (right side) */}
            <div className="relative w-80 lg:w-96 xl:w-[28rem] bg-card/95 backdrop-blur-sm border-l border-border flex-shrink-0">
              <div className="h-full bg-card">
                <FunctionalSidebar
                  onContentSelect={handleContentSelect}
                  selectedContentId={selectedContent?.id}
                  selectedContentType={selectedContent?.type}
                  selectedCourseId={selectedContent?.courseId}
                  selectedTopicId={selectedContent?.topicId}
                  initialSemesterId={selectedContent?.semesterInfo?.id}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Toaster />
    </div>
  )
}
