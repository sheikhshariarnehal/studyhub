"use client"

import { memo, useState, useCallback } from "react"
import { ChevronDown, ChevronRight, FileText, Play, Loader2, BookOpen, Star, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Skeleton } from "@/components/ui/skeleton"

// Smart text truncation utility for professional display
const smartTruncate = (text: string, maxLength: number = 45): string => {
  if (text.length <= maxLength) return text

  // Try to find a good breaking point (space, dash, colon, period)
  const breakPoints = [' ', '-', ':', '.', ',']
  let bestBreak = -1

  // Look for break points in the latter half of the allowed length
  for (let i = Math.floor(maxLength * 0.6); i < maxLength; i++) {
    if (breakPoints.includes(text[i])) {
      bestBreak = i
    }
  }

  // If we found a good break point, use it
  if (bestBreak > 0) {
    return text.substring(0, bestBreak) + '...'
  }

  // Otherwise, truncate at maxLength and add ellipsis
  return text.substring(0, maxLength - 3) + '...'
}

// Professional topic title formatter
const formatTopicTitle = (index: number, title: string, maxLength: number = 38): string => {
  const prefix = `${index + 1}. `
  const availableLength = maxLength - prefix.length

  if (title.length <= availableLength) {
    return `${prefix}${title}`
  }

  return `${prefix}${smartTruncate(title, availableLength)}`
}

interface Course {
  id: string
  title: string
  course_code: string
  teacher_name: string
  is_highlighted: boolean
  [key: string]: any
}

interface Video {
  id: string
  title: string
  video_url: string
  [key: string]: any
}

interface Slide {
  id: string
  title: string
  content_url: string
  [key: string]: any
}

interface OptimizedCourseItemProps {
  course: Course
  onContentSelect: (content: any) => void
  selectedContentId?: string
}

export const OptimizedCourseItem = memo(({ course, onContentSelect, selectedContentId }: OptimizedCourseItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [courseData, setCourseData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [prefetchStarted, setPrefetchStarted] = useState(false)

  // Prefetch on hover/focus with debounce
  const prefetchCourseData = useCallback(async () => {
    if (courseData || isLoading || prefetchStarted) return
    
    setPrefetchStarted(true)
    
    // Start loading immediately but don't show loading state yet
    try {
      const response = await fetch(`/api/courses/${course.id}/topics`)
      const data = await response.json()
      setCourseData(data)
    } catch (error) {
      console.error("Failed to prefetch course data:", error)
    }
  }, [course.id, courseData, isLoading, prefetchStarted])

  const fetchCourseData = useCallback(async () => {
    if (courseData || isLoading) return

    setIsLoading(true)
    try {
      // Fetch all course data in a single optimized request
      const response = await fetch(`/api/courses/${course.id}/topics`)
      const data = await response.json()
      setCourseData(data)
    } catch (error) {
      console.error("Failed to fetch course data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [course.id, courseData, isLoading])

  const handleToggle = useCallback(() => {
    // Optimistic UI: expand immediately
    setIsExpanded((prev) => {
      const newExpanded = !prev
      if (newExpanded && !courseData && !isLoading) {
        // Fetch data after state update for smoother animation
        setTimeout(() => fetchCourseData(), 0)
      }
      return newExpanded
    })
  }, [courseData, isLoading, fetchCourseData])

  // Prefetch on hover (for desktop)
  const handleMouseEnter = useCallback(() => {
    if (!isExpanded) {
      prefetchCourseData()
    }
  }, [isExpanded, prefetchCourseData])

  // Prefetch on focus (for keyboard navigation)
  const handleFocus = useCallback(() => {
    if (!isExpanded) {
      prefetchCourseData()
    }
  }, [isExpanded, prefetchCourseData])

  return (
    <div 
      className="space-y-1"
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
    >
      {/* Course Header */}
      <div className={`
        group relative overflow-hidden rounded-xl border transition-all duration-200 ease-out cursor-pointer
        will-change-transform
        hover:shadow-lg hover:-translate-y-0.5
        ${course.is_highlighted
          ? `border-l-4 border-l-emerald-500 dark:border-l-[#50727B]
             bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/20 dark:from-[#344955]/30 dark:via-[#50727B]/20 dark:to-[#78A083]/10
             shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-[#78A083]`
          : `border-l-4 border-l-transparent hover:border-l-primary/20
             bg-card hover:bg-muted/50 shadow-sm hover:shadow-md`
        }
      `}>
        {/* Gradient overlay for highlighted courses */}
        {course.is_highlighted && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-[#50727B]/10 dark:to-[#78A083]/5 pointer-events-none" />
        )}

        <div className="relative p-4 sm:p-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-left p-0 h-auto hover:bg-transparent touch-manipulation"
            onClick={handleToggle}
            tabIndex={0}
          >
            <div className="flex items-start gap-4 w-full">
              {/* Course Icon */}
              <div className={`rounded-lg flex items-center justify-center shrink-0 w-12 h-12 ${
                course.is_highlighted
                  ? 'bg-emerald-600 dark:bg-[#50727B]'
                  : 'bg-primary'
              }`}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Course Title and Status */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-foreground leading-tight tracking-tight truncate">
                    {course.title}
                  </h3>
                  {course.is_highlighted && (
                    <Star className="h-4 w-4 text-emerald-500 fill-emerald-500 dark:text-[#78A083] dark:fill-[#78A083] shrink-0" />
                  )}
                </div>

                {/* Course Code and Instructor */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                  <Badge
                    variant={course.is_highlighted ? "default" : "secondary"}
                    className="text-xs font-medium w-fit"
                  >
                    {course.course_code}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {course.teacher_name}
                    </span>
                  </div>
                </div>

                {/* Course Stats */}
                {courseData && (
                  <div className={`flex flex-wrap gap-3 mt-3 ${
                    course.is_highlighted
                      ? `p-3 rounded-lg bg-emerald-50/50 dark:bg-[#344955]/40 border border-emerald-200/50 dark:border-[#50727B]/30`
                      : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        course.is_highlighted
                          ? 'bg-emerald-600 dark:bg-[#50727B]'
                          : 'bg-slate-600 dark:bg-[#344955]'
                      }`}>
                        <BookOpen className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <span className={`text-sm font-bold leading-none ${
                          course.is_highlighted
                            ? 'text-emerald-900 dark:text-[#78A083]'
                            : 'text-slate-300 dark:text-slate-400'
                        }`}>
                          {courseData.length}
                        </span>
                        <p className={`text-xs font-medium ${
                          course.is_highlighted
                            ? 'text-emerald-700 dark:text-[#78A083]/80'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          Topics
                        </p>
                      </div>
                    </div>
                    {/* Calculate total slides */}
                    {(() => {
                      const totalSlides = courseData.reduce((total: number, topic: any) =>
                        total + (topic.slides?.length || 0), 0
                      );
                      return totalSlides > 0 && (
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            course.is_highlighted
                              ? 'bg-teal-600 dark:bg-[#78A083]'
                              : 'bg-slate-600 dark:bg-[#344955]'
                          }`}>
                            <Calendar className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <span className={`text-sm font-bold leading-none ${
                              course.is_highlighted
                                ? 'text-teal-900 dark:text-[#78A083]'
                                : 'text-slate-300 dark:text-slate-400'
                            }`}>
                              {totalSlides}
                            </span>
                            <p className={`text-xs font-medium ${
                              course.is_highlighted
                                ? 'text-teal-700 dark:text-[#78A083]/80'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              Slides
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Expand/Collapse Indicator */}
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>{isExpanded ? "Hide" : "Show"} content</span>
                  {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
                </div>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Course Content */}
      {isExpanded && (
        <div className="mt-4 px-4 sm:px-6 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {isLoading && !courseData ? (
            // Skeleton loading state
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="w-4 h-4 shrink-0" />
                  </div>
                </div>
              ))}
            </>
          ) : courseData ? (
            // Actual content
            <>
              {courseData.map((topic: any, index: number) => (
                <div
                  key={topic.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-150 cursor-pointer touch-manipulation transform hover:scale-[1.01]"
                  onClick={() => onContentSelect?.(topic)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate text-foreground">
                        {topic.title}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {topic.slides?.length || 0} slides • {topic.videos?.length || 0} videos
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
})

OptimizedCourseItem.displayName = "OptimizedCourseItem"

// Memoized Topic Item component
const TopicItem = memo(
  ({
    topic,
    index,
    courseTitle,
    onContentSelect,
    selectedContentId,
  }: {
    topic: any
    index: number
    courseTitle: string
    onContentSelect: (content: any) => void
    selectedContentId?: string
  }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const isMobile = useIsMobile()

    return (
      <div className="bg-slate-900/50 rounded-lg border border-slate-700/30">
        <Button
          variant="ghost"
          className={`
            w-full justify-start text-left h-auto hover:bg-slate-800/50 rounded-lg touch-manipulation
            ${isMobile ? 'p-2 sm:p-3' : 'p-3 sm:p-4'}
          `}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            {isExpanded ? (
              <ChevronDown className={`
                text-slate-400 transition-transform duration-200
                ${isMobile ? 'h-4 w-4' : 'h-4 w-4 sm:h-5 sm:w-5'}
              `} />
            ) : (
              <ChevronRight className={`
                text-slate-400 transition-transform duration-200
                ${isMobile ? 'h-4 w-4' : 'h-4 w-4 sm:h-5 sm:w-5'}
              `} />
            )}
            <div className="flex-1 min-w-0">
              <span
                className={`
                  font-medium text-slate-300 topic-title-professional block
                  ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}
                `}
                title={`${index + 1}. ${topic.title}`}
              >
                {formatTopicTitle(index, topic.title, isMobile ? 35 : 50)}
              </span>
            </div>
          </div>
        </Button>

        {isExpanded && (
          <div className={`
            space-y-1 animate-fade-in
            ${isMobile ? 'px-2 pb-2 sm:px-3 sm:pb-3' : 'px-3 pb-3 sm:px-4 sm:pb-4'}
          `}>
            {/* Videos */}
            {topic.videos?.map((video: Video, videoIndex: number) => {
              const isSelected = selectedContentId === video.id
              return (
                <Button
                  key={video.id}
                  variant="ghost"
                  className={`
                    w-full justify-start text-left h-auto rounded group touch-manipulation transition-colors
                    ${isMobile ? 'p-1.5 min-h-[40px]' : 'p-2'}
                    ${isSelected
                      ? "bg-primary/20 text-white"
                      : "hover:bg-slate-800/50 text-slate-300 hover:text-white"
                    }
                  `}
                  onClick={() =>
                    onContentSelect({
                      type: "video",
                      title: video.title,
                      url: video.youtube_url,
                      id: video.id,
                      topicTitle: topic.title,
                      courseTitle,
                    })
                  }
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <Play className={`
                      flex-shrink-0
                      ${isMobile ? 'h-3 w-3' : 'h-3 w-3'}
                      ${isSelected ? "text-red-300" : "text-red-400"}
                    `} />
                    <span className={`
                      truncate
                      ${isMobile ? 'text-xs' : 'text-sm'}
                      ${isSelected ? "font-medium" : ""}
                    `}>
                      {video.title}
                    </span>
                  </div>
                </Button>
              )
            })}

            {/* Slides */}
            {topic.slides?.map((slide: Slide, slideIndex: number) => {
              const isSelected = selectedContentId === slide.id
              return (
                <Button
                  key={slide.id}
                  variant="ghost"
                  className={`
                    w-full justify-start text-left h-auto rounded group touch-manipulation transition-colors
                    ${isMobile ? 'p-1.5 min-h-[40px]' : 'p-2'}
                    ${isSelected
                      ? "bg-primary/20 text-white"
                      : "hover:bg-slate-800/50 text-slate-300 hover:text-white"
                    }
                  `}
                  onClick={() =>
                    onContentSelect({
                      type: "slide",
                      title: slide.title,
                      url: slide.google_drive_url,
                      id: slide.id,
                      topicTitle: topic.title,
                      courseTitle,
                    })
                  }
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <FileText className={`
                      flex-shrink-0
                      ${isMobile ? 'h-3 w-3' : 'h-3 w-3'}
                      ${isSelected ? "text-blue-300" : "text-blue-400"}
                    `} />
                    <span className={`
                      truncate
                      ${isMobile ? 'text-xs' : 'text-sm'}
                      ${isSelected ? "font-medium" : ""}
                    `}>
                      {slide.title}
                    </span>
                  </div>
                </Button>
              )
            })}
          </div>
        )}
      </div>
    )
  },
)

TopicItem.displayName = "TopicItem"
