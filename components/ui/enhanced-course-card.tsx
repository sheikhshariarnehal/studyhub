"use client"

import * as React from "react"
import { useState, useCallback, memo } from "react"
import { 
  ChevronDown, 
  ChevronRight, 
  Star, 
  BookOpen, 
  User, 
  Calendar,
  Clock,
  GraduationCap,
  Loader2,
  MoreVertical,
  Play,
  FileText,
  Users
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface CourseStats {
  totalTopics: number
  totalVideos: number
  totalSlides: number
  totalStudyTools: number
  completedItems?: number
  enrolledStudents?: number
}

interface CourseCardProps {
  course: {
    id: string
    title: string
    course_code: string
    teacher_name: string
    teacher_email?: string
    description?: string
    credits?: number
    is_highlighted: boolean
    created_at: string
    updated_at: string
    semester?: {
      id: string
      title: string
      section: string
      is_active: boolean
    }
  }
  stats?: CourseStats
  progress?: number
  variant?: "default" | "compact" | "detailed"
  showActions?: boolean
  onContentSelect?: (content: any) => void
  onCourseSelect?: (courseId: string) => void
  onEdit?: (courseId: string) => void
  onDelete?: (courseId: string) => void
  selectedContentId?: string
  className?: string
}

export const EnhancedCourseCard = memo(({
  course,
  stats,
  progress,
  variant = "default",
  showActions = false,
  onContentSelect,
  onCourseSelect,
  onEdit,
  onDelete,
  selectedContentId,
  className
}: CourseCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [courseData, setCourseData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [prefetchStarted, setPrefetchStarted] = useState(false)

  // Prefetch on hover/focus with debounce
  const prefetchCourseData = useCallback(async () => {
    if (courseData || isLoading || prefetchStarted || variant === "compact") return
    
    setPrefetchStarted(true)
    
    // Start loading immediately but don't show loading state yet
    try {
      const response = await fetch(`/api/courses/${course.id}/topics`)
      const data = await response.json()
      setCourseData(data)
    } catch (error) {
      console.error("Failed to prefetch course data:", error)
    }
  }, [course.id, courseData, isLoading, prefetchStarted, variant])

  const fetchCourseData = useCallback(async () => {
    if (courseData || isLoading || variant === "compact") return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/topics`)
      const data = await response.json()
      setCourseData(data)
    } catch (error) {
      console.error("Failed to fetch course data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [course.id, courseData, isLoading, variant])

  const handleToggle = useCallback(() => {
    if (variant === "compact") {
      onCourseSelect?.(course.id)
      return
    }
    
    // Optimistic UI: expand immediately
    setIsExpanded(prev => {
      const newExpanded = !prev
      if (newExpanded && !courseData && !isLoading) {
        // Fetch data after state update for smoother animation
        setTimeout(() => fetchCourseData(), 0)
      }
      return newExpanded
    })
  }, [variant, onCourseSelect, course.id, courseData, isLoading, fetchCourseData])

  // Prefetch on hover (for desktop)
  const handleMouseEnter = useCallback(() => {
    if (!isExpanded && variant !== "compact") {
      prefetchCourseData()
    }
  }, [isExpanded, variant, prefetchCourseData])

  // Prefetch on focus (for keyboard navigation)
  const handleFocus = useCallback(() => {
    if (!isExpanded && variant !== "compact") {
      prefetchCourseData()
    }
  }, [isExpanded, variant, prefetchCourseData])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const cardVariants = {
    default: "p-6",
    compact: "p-4",
    detailed: "p-6"
  }

  const titleVariants = {
    default: "text-lg font-semibold",
    compact: "text-base font-medium",
    detailed: "text-xl font-bold"
  }

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-200 ease-out",
        "will-change-transform",
        "hover:shadow-lg hover:-translate-y-0.5",
        course.is_highlighted
          ? "border-l-4 border-l-emerald-500 dark:border-l-[#50727B] bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/20 dark:from-[#344955]/30 dark:via-[#50727B]/20 dark:to-[#78A083]/10"
          : "border-l-4 border-l-transparent hover:border-l-primary/20",
        "cursor-pointer",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      tabIndex={0}
    >
      {/* Gradient overlay for highlighted courses */}
      {course.is_highlighted && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-[#50727B]/10 dark:to-[#78A083]/5 pointer-events-none" />
      )}

      <CardHeader className={cn("relative", cardVariants[variant])}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0" onClick={handleToggle}>
            {/* Course Icon/Avatar */}
            <div className={cn(
              "rounded-lg flex items-center justify-center shrink-0",
              course.is_highlighted 
                ? "bg-emerald-600 dark:bg-[#50727B]" 
                : "bg-primary",
              variant === "compact" ? "w-10 h-10" : "w-12 h-12"
            )}>
              <GraduationCap className={cn(
                "text-white",
                variant === "compact" ? "h-5 w-5" : "h-6 w-6"
              )} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Course Title and Status */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className={cn(
                  titleVariants[variant],
                  "text-foreground leading-tight tracking-tight truncate"
                )}>
                  {course.title}
                </h3>
                {course.is_highlighted && (
                  <Star className="h-4 w-4 text-emerald-500 fill-emerald-500 dark:text-[#78A083] dark:fill-[#78A083] shrink-0" />
                )}
              </div>

              {/* Course Code and Semester */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Badge
                  variant={course.is_highlighted ? "default" : "secondary"}
                  className="text-xs font-medium"
                >
                  {course.course_code}
                </Badge>
                {course.semester && (
                  <span className="text-sm text-muted-foreground">
                    {course.semester.title} • {course.semester.section}
                  </span>
                )}
                {course.credits && (
                  <span className="text-sm text-muted-foreground">
                    {course.credits} credits
                  </span>
                )}
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.teacher_name}`} />
                  <AvatarFallback className="text-xs bg-muted">
                    {getInitials(course.teacher_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {course.teacher_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                </div>
              </div>

              {/* Progress Bar (if progress provided) */}
              {progress !== undefined && variant !== "compact" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Course Stats */}
              {stats && variant !== "compact" && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{stats.totalTopics}</p>
                      <p className="text-xs text-muted-foreground">Topics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Play className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{stats.totalVideos}</p>
                      <p className="text-xs text-muted-foreground">Videos</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expand/Collapse Indicator */}
              {variant !== "compact" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>{isExpanded ? "Hide" : "Show"} content</span>
                  {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(course.id)}>
                  Edit Course
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(course.id)} className="text-destructive">
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && variant !== "compact" && (
        <CardContent className="pt-0 pb-6 px-6">
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {isLoading && !courseData ? (
              // Skeleton loading state
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
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
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-150 cursor-pointer transform hover:scale-[1.01]"
                    onClick={() => onContentSelect?.(topic)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center transition-colors">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{topic.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {topic.slides?.length || 0} slides • {topic.videos?.length || 0} videos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </CardContent>
      )}
    </Card>
  )
})

EnhancedCourseCard.displayName = "EnhancedCourseCard"
