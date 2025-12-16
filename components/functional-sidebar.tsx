"use client"

import React, { useState, useEffect, useCallback, useMemo, memo, useRef, startTransition } from "react"
import {
  ChevronDown, ChevronRight, FileText, Play, BookOpen, Loader2, AlertCircle,
  GraduationCap, ClipboardList, BarChart3, PenTool, FlaskConical, Library
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"
import { useIsMobile } from "@/components/ui/use-mobile"

type Semester = Database["public"]["Tables"]["semesters"]["Row"]
type Course = Database["public"]["Tables"]["courses"]["Row"]
type Topic = Database["public"]["Tables"]["topics"]["Row"]
type Slide = Database["public"]["Tables"]["slides"]["Row"]
type Video = Database["public"]["Tables"]["videos"]["Row"]
type StudyTool = Database["public"]["Tables"]["study_tools"]["Row"]

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
const formatTopicTitle = (index: number, title: string, maxLength: number = 42): string => {
  const prefix = `${index + 1}. `
  const availableLength = maxLength - prefix.length

  if (title.length <= availableLength) {
    return `${prefix}${title}`
  }

  return `${prefix}${smartTruncate(title, availableLength)}`
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

interface FunctionalSidebarProps {
  onContentSelect: (content: ContentItem) => void
  selectedContentId?: string
  initialSemesterId?: string // Auto-select this semester when loading content from URL
}

// Optimized cache system with LRU eviction
const dataCache = new Map<string, { data: any; timestamp: number; hits: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
const MAX_CACHE_SIZE = 100

// LRU cache helper
const getCachedData = async (key: string, fetchFn: () => Promise<any>): Promise<any> => {
  const cached = dataCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    cached.hits++
    return cached.data
  }

  // LRU eviction if cache is full
  if (dataCache.size >= MAX_CACHE_SIZE) {
    const lruKey = Array.from(dataCache.entries())
      .sort((a, b) => a[1].hits - b[1].hits)[0]?.[0]
    if (lruKey) dataCache.delete(lruKey)
  }

  const data = await fetchFn()
  dataCache.set(key, { data, timestamp: Date.now(), hits: 1 })
  return data
}

// Debounce utility for scroll handlers
const useDebounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

export function FunctionalSidebar({ onContentSelect, selectedContentId, initialSemesterId }: FunctionalSidebarProps) {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemester, setSelectedSemester] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Optimized expansion states using useRef for non-render-critical updates
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedStudyTools, setExpandedStudyTools] = useState<Set<string>>(new Set())
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedTopicItems, setExpandedTopicItems] = useState<Set<string>>(new Set())

  // Course data cache with loading states - using Map for O(1) lookups
  const [courseData, setCourseData] = useState<Record<string, any>>({})

  // Track if we've tried to auto-expand for current content
  const hasAutoExpandedRef = useRef<string | null>(null)
  
  // Scroll container ref for optimized scroll handling
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Reset auto-expand ref when selectedContentId changes
  useEffect(() => {
    // Only reset if content actually changed to something different (not just mounted)
    if (selectedContentId && selectedContentId !== hasAutoExpandedRef.current && hasAutoExpandedRef.current !== null) {
      hasAutoExpandedRef.current = null
    }
  }, [selectedContentId])

  // Mobile-specific state and functionality
  const isMobile = useIsMobile()
  const touchStartRef = useRef<number | null>(null)
  const isScrollingRef = useRef(false)

  // Fetch semesters on component mount
  useEffect(() => {
    fetchSemesters()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update selected semester when initialSemesterId changes (e.g., loading content from URL)
  useEffect(() => {
    if (initialSemesterId && semesters.length > 0) {
      const validSemester = semesters.find((s: any) => s.id === initialSemesterId)
      if (validSemester && selectedSemester !== initialSemesterId) {
        console.log("Auto-selecting semester from URL content:", initialSemesterId)
        setSelectedSemester(initialSemesterId)
      }
    }
  }, [initialSemesterId, semesters, selectedSemester])

  // Fetch courses when semester changes
  useEffect(() => {
    if (selectedSemester) {
      fetchCourses(selectedSemester)
    }
  }, [selectedSemester])

  // Auto-expand sidebar when content is selected (on page load/refresh)
  useEffect(() => {
    if (!selectedContentId || courses.length === 0) return
    if (hasAutoExpandedRef.current === selectedContentId) return

    let timeoutId: NodeJS.Timeout
    let isCancelled = false

    const expandSidebarForSelectedContent = async () => {
      try {
        // Load all course data in parallel
        await Promise.all(
          courses.map(async (course) => {
            const courseId = (course as any).id
            if (!courseData[courseId] || courseData[courseId].isLoading) {
              await fetchCourseData(courseId)
            }
          })
        )

        if (isCancelled) return

        // Brief wait for state to settle
        await new Promise(resolve => setTimeout(resolve, 100))

        if (isCancelled) return

        // Search for content and expand
        for (const course of courses) {
          const courseId = (course as any).id
          const data = courseData[courseId]
          
          if (!data || data.isLoading) continue

          // Check study tools
          if (data.studyTools?.some((tool: any) => tool.id === selectedContentId)) {
            setExpandedCourses(new Set([courseId]))
            setExpandedStudyTools(new Set([courseId]))
            hasAutoExpandedRef.current = selectedContentId
            
            requestAnimationFrame(() => {
              const el = document.querySelector(`[data-content-id="${selectedContentId}"]`)
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            })
            return
          }

          // Check topics for videos/slides
          for (const topic of data.topics || []) {
            const videos = data.videos?.[topic.id] || []
            const slides = data.slides?.[topic.id] || []
            
            // Load topic content if needed
            if (videos.length === 0 && slides.length === 0) {
              await fetchTopicContent(courseId, topic.id)
              await new Promise(resolve => setTimeout(resolve, 50))
              
              if (isCancelled) return
              
              const freshData = courseData[courseId]
              const freshVideos = freshData?.videos?.[topic.id] || []
              const freshSlides = freshData?.slides?.[topic.id] || []
              
              if (freshVideos.some((v: any) => v.id === selectedContentId) ||
                  freshSlides.some((s: any) => s.id === selectedContentId)) {
                setExpandedCourses(new Set([courseId]))
                setExpandedTopics(new Set([courseId]))
                setExpandedTopicItems(new Set([topic.id]))
                hasAutoExpandedRef.current = selectedContentId
                
                requestAnimationFrame(() => {
                  const el = document.querySelector(`[data-content-id="${selectedContentId}"]`)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                })
                return
              }
            } else {
              // Check loaded content
              if (videos.some((v: any) => v.id === selectedContentId) ||
                  slides.some((s: any) => s.id === selectedContentId)) {
                setExpandedCourses(new Set([courseId]))
                setExpandedTopics(new Set([courseId]))
                setExpandedTopicItems(new Set([topic.id]))
                hasAutoExpandedRef.current = selectedContentId
                
                requestAnimationFrame(() => {
                  const el = document.querySelector(`[data-content-id="${selectedContentId}"]`)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                })
                return
              }
            }
          }
        }
      } catch (error) {
        console.error('Error expanding sidebar:', error)
      }
    }

    timeoutId = setTimeout(() => {
      expandSidebarForSelectedContent()
    }, 50)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContentId, courses, courseData])

  const fetchSemesters = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getCachedData("semesters", async () => {
        const { data, error } = await supabase.from("semesters").select("*").order("created_at", { ascending: false })
        if (error) throw error
        return data || []
      })

      setSemesters(data)

      // Priority for semester selection:
      // 1. initialSemesterId from URL content (if valid)
      // 2. First active semester
      // 3. First semester in list
      if (data && data.length > 0) {
        let semesterToSelect = null
        
        // Check if initialSemesterId is provided and valid
        if (initialSemesterId) {
          semesterToSelect = data.find((s: any) => s.id === initialSemesterId)
        }
        
        // Fallback to active semester
        if (!semesterToSelect) {
          semesterToSelect = data.find((semester: any) => semester.is_active === true)
        }
        
        // Fallback to first semester
        if (!semesterToSelect) {
          semesterToSelect = data[0]
        }
        
        setSelectedSemester(semesterToSelect.id)
      }
    } catch (err) {
      console.error("Error fetching semesters:", err)
      setError("Failed to load semesters")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourses = async (semesterId: string) => {
    try {
      setError(null)

      const data = await getCachedData(`courses-${semesterId}`, async () => {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("semester_id", semesterId)
          .order("is_highlighted", { ascending: false }) // Highlighted courses first
          .order("created_at", { ascending: true })
        if (error) throw error
        return data || []
      })

      setCourses(data)
    } catch (err) {
      console.error("Error fetching courses:", err)
      setError("Failed to load courses")
    }
  }

  const fetchCourseData = useCallback(async (courseId: string) => {
    if (courseData[courseId] && !courseData[courseId].isLoading) return

    // Set loading state
    setCourseData((prev) => ({
      ...prev,
      [courseId]: {
        topics: [],
        studyTools: [],
        slides: {},
        videos: {},
        isLoading: true,
      },
    }))

    try {
      // Use optimized single query to fetch all course data
      const data = await getCachedData(`course-data-${courseId}`, async () => {
        // Fetch only topics first (most important data)
        const topicsResult = await supabase
          .from("topics")
          .select("id, title, order_index, course_id")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true })

        if (topicsResult.error) throw topicsResult.error

        // Fetch study tools in parallel (less priority)
        const studyToolsPromise = supabase
          .from("study_tools")
          .select("id, title, type, content_url, description, course_id")
          .eq("course_id", courseId)

        const studyToolsResult = await studyToolsPromise

        return {
          topics: topicsResult.data || [],
          studyTools: studyToolsResult.data || [],
          slides: {},
          videos: {},
        }
      })

      setCourseData((prev) => ({
        ...prev,
        [courseId]: {
          ...data,
          isLoading: false,
        },
      }))
    } catch (err) {
      console.error("Error fetching course data:", err)
      setCourseData((prev) => ({
        ...prev,
        [courseId]: {
          topics: [],
          studyTools: [],
          slides: {},
          videos: {},
          isLoading: false,
        },
      }))
    }
  }, [courseData])

  // Optimized toggle functions with batched state updates
  const toggleCourse = useCallback((courseId: string) => {
    startTransition(() => {
      setExpandedCourses((prev) => {
        const isCurrentlyExpanded = prev.has(courseId)
        
        if (isCurrentlyExpanded) {
          // Batch collapse all
          setExpandedTopics(new Set())
          setExpandedTopicItems(new Set())
          setExpandedStudyTools(new Set())
          return new Set()
        } else {
          // Batch reset and expand new
          setExpandedTopics(new Set())
          setExpandedTopicItems(new Set())
          setExpandedStudyTools(new Set())
          // Fetch data asynchronously
          queueMicrotask(() => fetchCourseData(courseId))
          return new Set([courseId])
        }
      })
    })
  }, [fetchCourseData])

  const toggleStudyTools = useCallback((courseId: string) => {
    startTransition(() => {
      setExpandedStudyTools((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(courseId)) {
          newSet.delete(courseId)
        } else {
          newSet.add(courseId)
        }
        return newSet
      })
    })
  }, [])

  const toggleTopics = useCallback((courseId: string) => {
    startTransition(() => {
      setExpandedTopics((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(courseId)) {
          newSet.delete(courseId)
        } else {
          newSet.add(courseId)
        }
        return newSet
      })
    })
  }, [])

  // Lazy load topic content (slides and videos) only when expanded
  const fetchTopicContent = useCallback(async (courseId: string, topicId: string) => {
    const currentCourseData = courseData[courseId]
    if (!currentCourseData || currentCourseData.slides[topicId] || currentCourseData.videos[topicId]) return

    try {
      const cacheKey = `topic-content-${topicId}`
      const data = await getCachedData(cacheKey, async () => {
        const [slidesResult, videosResult] = await Promise.all([
          supabase
            .from("slides")
            .select("id, title, google_drive_url, order_index, topic_id")
            .eq("topic_id", topicId)
            .order("order_index", { ascending: true }),
          supabase
            .from("videos")
            .select("id, title, youtube_url, order_index, topic_id")
            .eq("topic_id", topicId)
            .order("order_index", { ascending: true }),
        ])

        return {
          slides: slidesResult.data || [],
          videos: videosResult.data || [],
        }
      })

      setCourseData((prev) => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          slides: {
            ...prev[courseId].slides,
            [topicId]: data.slides,
          },
          videos: {
            ...prev[courseId].videos,
            [topicId]: data.videos,
          },
        },
      }))
    } catch (err) {
      console.error("Error fetching topic content:", err)
    }
  }, [courseData])

  const toggleTopicItem = useCallback((topicId: string, courseId: string) => {
    startTransition(() => {
      setExpandedTopicItems((prev) => {
        const newSet = new Set(prev)
        
        // If clicking on already expanded topic, collapse it
        if (newSet.has(topicId)) {
          newSet.delete(topicId)
        } else {
          // Close all other topics in the same course before opening this one
          const currentCourseData = courseData[courseId]
          if (currentCourseData?.topics) {
            currentCourseData.topics.forEach((topic: Topic) => {
              if (topic.id !== topicId) {
                newSet.delete(topic.id)
              }
            })
          }
          
          // Now add the new topic
          newSet.add(topicId)
          // Lazy load content when expanding
          queueMicrotask(() => fetchTopicContent(courseId, topicId))
        }
        return newSet
      })
    })
  }, [fetchTopicContent, courseData])

  // Optimized content selection handler with memoization
  const handleContentClick = useCallback(
    (
      type: "slide" | "video" | "document" | "syllabus" | "study-tool",
      title: string,
      url: string,
      id: string,
      topicTitle?: string,
      courseTitle?: string,
      description?: string,
      courseCode?: string,
      semesterInfo?: { id: string; title: string; section: string; is_active: boolean },
    ) => {
      onContentSelect({
        type,
        title,
        url,
        id,
        topicTitle,
        courseTitle,
        description,
        courseCode,
        semesterInfo,
      })
    },
    [onContentSelect],
  )

  // Memoized utility functions
  const getStudyToolIcon = useCallback((type: string) => {
    switch (type) {
      case "previous_questions":
        return <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      case "exam_note":
      case "exam_notes":
        return <BookOpen className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
      case "syllabus":
        return <GraduationCap className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
      case "mark_distribution":
        return <BarChart3 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
      case "assignment":
        return <PenTool className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
      case "lab_manual":
        return <FlaskConical className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
      case "reference_book":
        return <Library className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
      default:
        return <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
    }
  }, [])

  const getStudyToolLabel = useCallback((type: string) => {
    switch (type) {
      case "previous_questions":
        return "Previous Questions"
      case "exam_note":
      case "exam_notes":
        return "Exam Notes"
      case "syllabus":
        return "Syllabus"
      case "mark_distribution":
        return "Mark Distribution"
      case "assignment":
        return "Assignment"
      case "lab_manual":
        return "Lab Manual"
      case "reference_book":
        return "Reference Book"
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }, [])

  // Memoized filtered courses
  const filteredCourses = useMemo(() => {
    return courses
  }, [courses])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Skeleton Loader for better perceived performance */}
        <div className={`${isMobile ? 'px-4 py-3' : 'p-4'} border-b border-border/30`}>
          <div className="h-11 bg-muted/50 rounded-lg animate-pulse"></div>
        </div>
        <div className={`${isMobile ? 'px-4 py-3' : 'p-4'} space-y-3`}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg border border-border/20 p-3 animate-pulse">
              <div className="h-4 bg-muted/50 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted/30 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-background ${isMobile ? 'mobile-scroll-container' : ''}`}>
      {/* Header - Simplified for Mobile */}
      <div className={`${isMobile ? 'px-4 py-3 bg-background border-b border-border/30' : 'p-4 border-b border-border'}`}>
        {/* Mobile: Simple header without title */}
        {isMobile ? (
          <div>
            {/* Simplified Semester Selection for Mobile */}
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-11 bg-card border-border/50 text-foreground rounded-lg shadow-sm">
                <SelectValue placeholder="Select Semester">
                  {selectedSemester && (() => {
                    const selectedSem = semesters.find(s => s.id === selectedSemester)
                    return selectedSem ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium truncate">
                          {selectedSem.title} {selectedSem.section && `(${selectedSem.section})`}
                        </span>
                        {(selectedSem.is_active ?? true) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full ml-2 flex-shrink-0"></div>
                        )}
                      </div>
                    ) : null
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50 rounded-lg shadow-lg">
                {semesters.map((semester) => (
                  <SelectItem
                    key={semester.id}
                    value={semester.id}
                    className="text-foreground hover:bg-accent/50 py-3 px-4 rounded-md mx-1"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {semester.title}
                        </span>
                        {semester.section && (
                          <span className="text-xs text-muted-foreground">
                            Section: {semester.section}
                          </span>
                        )}
                      </div>
                      {(semester.is_active ?? true) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          /* Desktop Header */
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">Course Content</h3>
            </div>

            {/* Desktop Semester Selection */}
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="bg-card border-border text-foreground h-11">
                <SelectValue placeholder="Choose your semester">
                  {selectedSemester && (() => {
                    const selectedSem = semesters.find(s => s.id === selectedSemester)
                    return selectedSem ? (
                      <div className="flex items-center gap-2">
                        <span>{selectedSem.title} {selectedSem.section && `(${selectedSem.section})`}</span>
                        {(selectedSem.is_active ?? true) && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    ) : null
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {semesters.map((semester) => (
                  <SelectItem
                    key={semester.id}
                    value={semester.id}
                    className="text-foreground hover:bg-accent"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {semester.title} {semester.section && `(${semester.section})`}
                      </span>
                      {(semester.is_active ?? true) && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4">
          <Alert className="bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Course List - Optimized with refs for touch handling */}
      <ScrollArea className={`flex-1 ${isMobile ? 'mobile-scroll-container' : ''}`}>
        <div
          ref={scrollContainerRef}
          className={`${isMobile ? 'px-4 py-3 space-y-2' : 'px-3 py-2.5 space-y-2'}`}
          onTouchStart={(e) => {
            if (isMobile) {
              touchStartRef.current = e.touches[0].clientY
              isScrollingRef.current = false
            }
          }}
          onTouchMove={(e) => {
            if (isMobile && touchStartRef.current !== null) {
              const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current)
              if (deltaY > 10) {
                isScrollingRef.current = true
              }
            }
          }}
          onTouchEnd={() => {
            if (isMobile) {
              touchStartRef.current = null
              requestAnimationFrame(() => {
                isScrollingRef.current = false
              })
            }
          }}
        >
          {filteredCourses.length === 0 ? (
            <div className={`text-center ${isMobile ? 'py-6' : 'py-8 sm:py-12'}`}>
              <BookOpen className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10 sm:h-12 sm:w-12'} text-muted-foreground mx-auto mb-4`} />
              <p className={`${isMobile ? 'text-sm' : 'text-sm sm:text-base'} text-muted-foreground`}>
                No courses available
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">Check your semester selection</p>
            </div>
          ) : (
            filteredCourses.map((course) => {
              // Get current semester info for semantic URLs
              const currentSemester = semesters.find((s: Semester) => s.id === selectedSemester)
              const semesterInfo = currentSemester ? {
                id: currentSemester.id,
                title: currentSemester.title,
                section: currentSemester.section || '',
                is_active: currentSemester.is_active || false,
              } : undefined

              return (
                <CourseItem
                  key={course.id}
                  course={course}
                  courseData={courseData[course.id]}
                  expandedCourses={expandedCourses}
                  expandedStudyTools={expandedStudyTools}
                  expandedTopics={expandedTopics}
                  expandedTopicItems={expandedTopicItems}
                  onToggleCourse={toggleCourse}
                  onToggleStudyTools={toggleStudyTools}
                  onToggleTopics={toggleTopics}
                  onToggleTopicItem={toggleTopicItem}
                  onContentClick={handleContentClick}
                  getStudyToolIcon={getStudyToolIcon}
                  getStudyToolLabel={getStudyToolLabel}
                  selectedContentId={selectedContentId}
                  isMobile={isMobile}
                  semesterInfo={semesterInfo}
                />
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Optimized CourseItem with deep memo comparison
interface CourseItemProps {
  course: Course
  courseData?: any
  expandedCourses: Set<string>
  expandedStudyTools: Set<string>
  expandedTopics: Set<string>
  expandedTopicItems: Set<string>
  onToggleCourse: (id: string) => void
  onToggleStudyTools: (id: string) => void
  onToggleTopics: (id: string) => void
  onToggleTopicItem: (topicId: string, courseId: string) => void
  onContentClick: (
    type: any,
    title: string,
    url: string,
    id: string,
    topicTitle?: string,
    courseTitle?: string,
    description?: string,
    courseCode?: string,
    semesterInfo?: { id: string; title: string; section: string; is_active: boolean },
  ) => void
  getStudyToolIcon: (type: string) => React.ReactNode
  getStudyToolLabel: (type: string) => string
  selectedContentId?: string
  isMobile?: boolean
  semesterInfo?: { id: string; title: string; section: string; is_active: boolean }
}

const CourseItem = memo<CourseItemProps>(
  ({
    course,
    courseData,
    expandedCourses,
    expandedStudyTools,
    expandedTopics,
    expandedTopicItems,
    onToggleCourse,
    onToggleStudyTools,
    onToggleTopics,
    onToggleTopicItem,
    onContentClick,
    getStudyToolIcon,
    getStudyToolLabel,
    selectedContentId,
    isMobile = false,
    semesterInfo,
  }) => {
    // Memoize computed values
    const isExpanded = expandedCourses.has(course.id)
    const isStudyToolsExpanded = expandedStudyTools.has(course.id)
    const isTopicsExpanded = expandedTopics.has(course.id)
    
    // Memoize click handler
    const handleCourseClick = useCallback(() => {
      onToggleCourse(course.id)
    }, [onToggleCourse, course.id])

    return (
      <div className={`${isMobile ? 'space-y-2' : 'space-y-1.5'} will-change-transform`}>
        {/* Professional Course Card */}
        <div className={`group relative ${isMobile ? 'bg-card rounded-xl border border-border/30 shadow-sm' : 'bg-card rounded-xl hover:shadow-md transition-shadow duration-200 border border-border/40 hover:border-primary/30'} ${
          isExpanded ? 'shadow-sm border-primary/20' : ''
        }`}>
          <div className={`${isMobile ? 'p-3' : 'p-3'} rounded-xl ${
            course.is_highlighted 
              ? 'bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-l-4 border-amber-400 dark:border-amber-600' 
              : ''
          }`}>
            <Button
              variant="ghost"
              className={`w-full justify-start text-left p-0 h-auto hover:bg-transparent ${isMobile ? 'min-h-[48px]' : ''}`}
              onClick={handleCourseClick}
            >
              <div className={`flex items-start w-full ${isMobile ? 'gap-3' : 'gap-2.5'}`}>
                {/* Chevron Icon - GPU accelerated */}
                <div className={`flex-shrink-0 ${isMobile ? 'mt-1' : 'mt-0.5'} transform-gpu`}>
                  {isExpanded ? (
                    <div className="p-1 rounded-md bg-primary/15 transition-colors duration-150">
                      <ChevronDown className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} text-primary`} />
                    </div>
                  ) : (
                    <div className="p-1 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors duration-150">
                      <ChevronRight className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} text-muted-foreground group-hover:text-primary transition-colors duration-150`} />
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="flex-1 min-w-0">
                  {isMobile ? (
                    /* Mobile Layout - Clean & Professional */
                    <div>
                      <div className="flex items-start gap-2 mb-1.5">
                        <h4 className="font-semibold text-sm text-foreground leading-tight flex-1 line-clamp-2">
                          {course.title}
                        </h4>
                        {course.is_highlighted && (
                          <div className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 rounded-md">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Featured</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-md">
                          {course.course_code}
                        </span>
                        <span className="text-xs text-muted-foreground/60">•</span>
                        <span className="text-xs text-muted-foreground truncate font-medium">
                          {course.teacher_name}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Desktop Layout - Professional & Compact */
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1 flex-1">
                          {course.title}
                        </h4>
                        {course.is_highlighted && (
                          <div className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 rounded-md">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Featured</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-md">
                          {course.course_code}
                        </span>
                        <span className="text-xs text-muted-foreground/60">•</span>
                        <span className="text-xs text-muted-foreground font-medium line-clamp-1 flex-1">
                          {course.teacher_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {courseData?.isLoading && (
                    <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-muted/30 rounded-md">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">Loading content...</span>
                    </div>
                  )}
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Course Content with GPU-accelerated Animation */}
        {isExpanded && courseData && !courseData.isLoading && (
          <div className={`${isMobile ? 'ml-4 space-y-1.5' : 'ml-3 space-y-1'} transform-gpu`}>
            {/* Study Tools Section */}
            {courseData.studyTools.length > 0 && (
              <StudyToolsSection
                courseId={course.id}
                courseTitle={course.title}
                courseCode={course.course_code}
                studyTools={courseData.studyTools}
                isExpanded={isStudyToolsExpanded}
                onToggle={onToggleStudyTools}
                onContentClick={onContentClick}
                getStudyToolIcon={getStudyToolIcon}
                selectedContentId={selectedContentId}
                isMobile={isMobile}
                semesterInfo={semesterInfo}
              />
            )}

            {/* Topics Section */}
            {courseData.topics.length > 0 && (
              <TopicsSection
                courseId={course.id}
                courseTitle={course.title}
                courseCode={course.course_code}
                topics={courseData.topics}
                slides={courseData.slides}
                videos={courseData.videos}
                isExpanded={isTopicsExpanded}
                expandedTopicItems={expandedTopicItems}
                onToggle={onToggleTopics}
                onToggleTopicItem={onToggleTopicItem}
                onContentClick={onContentClick}
                selectedContentId={selectedContentId}
                isMobile={isMobile}
                semesterInfo={semesterInfo}
              />
            )}

            {/* Empty state for course with no content */}
            {courseData.topics.length === 0 && courseData.studyTools.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">No content available for this course</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
  // Custom comparison for better memoization
  (prevProps, nextProps) => {
    return (
      prevProps.course.id === nextProps.course.id &&
      prevProps.expandedCourses.has(prevProps.course.id) === nextProps.expandedCourses.has(nextProps.course.id) &&
      prevProps.expandedStudyTools.has(prevProps.course.id) === nextProps.expandedStudyTools.has(nextProps.course.id) &&
      prevProps.expandedTopics.has(prevProps.course.id) === nextProps.expandedTopics.has(nextProps.course.id) &&
      prevProps.selectedContentId === nextProps.selectedContentId &&
      prevProps.courseData === nextProps.courseData &&
      prevProps.isMobile === nextProps.isMobile &&
      // Only shallow compare expandedTopicItems if topics are expanded
      (!nextProps.expandedTopics.has(nextProps.course.id) || 
        areSetsEqual(prevProps.expandedTopicItems, nextProps.expandedTopicItems, nextProps.courseData?.topics))
    )
  }
)

// Helper to compare sets for relevant topic IDs only
function areSetsEqual(set1: Set<string>, set2: Set<string>, topics?: Topic[]): boolean {
  if (!topics) return true
  for (const topic of topics) {
    if (set1.has(topic.id) !== set2.has(topic.id)) return false
  }
  return true
}

CourseItem.displayName = "CourseItem"

// Memoized Study Tools Section Component
interface StudyToolsSectionProps {
  courseId: string
  courseTitle: string
  courseCode: string
  studyTools: StudyTool[]
  isExpanded: boolean
  onToggle: (courseId: string) => void
  onContentClick: (type: any, title: string, url: string, id: string, topicTitle?: string, courseTitle?: string, description?: string, courseCode?: string, semesterInfo?: any) => void
  getStudyToolIcon: (type: string) => React.ReactNode
  selectedContentId?: string
  isMobile?: boolean
  semesterInfo?: any
}

const StudyToolsSection = memo<StudyToolsSectionProps>(({
  courseId,
  courseTitle,
  courseCode,
  studyTools,
  isExpanded,
  onToggle,
  onContentClick,
  getStudyToolIcon,
  selectedContentId,
  isMobile,
  semesterInfo,
}) => {
  const handleToggle = useCallback(() => onToggle(courseId), [onToggle, courseId])

  return (
    <div>
      <Button
        variant="ghost"
        className={`w-full justify-start text-left ${isMobile ? 'p-2 h-auto hover:bg-accent/30 rounded-md' : 'px-2 py-1.5 h-auto hover:bg-accent rounded-md'}`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm text-foreground flex-1">Study Resources</span>
          <span className="text-xs text-muted-foreground">{studyTools.length}</span>
        </div>
      </Button>

      {isExpanded && (
        <div className="ml-5 space-y-0.5 mt-0.5">
          {studyTools.map((tool) => (
            <StudyToolItem
              key={tool.id}
              tool={tool}
              courseTitle={courseTitle}
              courseCode={courseCode}
              isSelected={selectedContentId === tool.id}
              onContentClick={onContentClick}
              getStudyToolIcon={getStudyToolIcon}
              semesterInfo={semesterInfo}
            />
          ))}
        </div>
      )}
    </div>
  )
})

StudyToolsSection.displayName = "StudyToolsSection"

// Memoized Study Tool Item
interface StudyToolItemProps {
  tool: StudyTool
  courseTitle: string
  courseCode: string
  isSelected: boolean
  onContentClick: (type: any, title: string, url: string, id: string, topicTitle?: string, courseTitle?: string, description?: string, courseCode?: string, semesterInfo?: any) => void
  getStudyToolIcon: (type: string) => React.ReactNode
  semesterInfo?: any
}

const StudyToolItem = memo<StudyToolItemProps>(({
  tool,
  courseTitle,
  courseCode,
  isSelected,
  onContentClick,
  getStudyToolIcon,
  semesterInfo,
}) => {
  const handleClick = useCallback(() => {
    if (tool.type === "syllabus") {
      onContentClick("syllabus", tool.title, `#syllabus-${tool.id}`, tool.id, undefined, courseTitle, tool.description || '', courseCode, semesterInfo)
    } else if (tool.content_url) {
      onContentClick("study-tool", tool.title, tool.content_url, tool.id, undefined, courseTitle, undefined, courseCode, semesterInfo)
    }
  }, [tool, courseTitle, courseCode, onContentClick, semesterInfo])

  return (
    <Button
      variant="ghost"
      className={`w-full justify-start text-left px-2 py-1.5 h-auto rounded transition-colors duration-150 ${
        isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent/50"
      }`}
      onClick={handleClick}
      disabled={tool.type !== "syllabus" && !tool.content_url}
    >
      <div className="flex items-center gap-2 w-full">
        {getStudyToolIcon(tool.type)}
        <span className={`text-xs truncate flex-1 ${isSelected ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {tool.title}
        </span>
        {isSelected && <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
      </div>
    </Button>
  )
})

StudyToolItem.displayName = "StudyToolItem"

// Memoized Topics Section Component
interface TopicsSectionProps {
  courseId: string
  courseTitle: string
  courseCode: string
  topics: Topic[]
  slides: Record<string, Slide[]>
  videos: Record<string, Video[]>
  isExpanded: boolean
  expandedTopicItems: Set<string>
  onToggle: (courseId: string) => void
  onToggleTopicItem: (topicId: string, courseId: string) => void
  onContentClick: (type: any, title: string, url: string, id: string, topicTitle?: string, courseTitle?: string, description?: string, courseCode?: string, semesterInfo?: any) => void
  selectedContentId?: string
  isMobile?: boolean
  semesterInfo?: any
}

const TopicsSection = memo<TopicsSectionProps>(({
  courseId,
  courseTitle,
  courseCode,
  topics,
  slides,
  videos,
  isExpanded,
  expandedTopicItems,
  onToggle,
  onToggleTopicItem,
  onContentClick,
  selectedContentId,
  isMobile,
  semesterInfo,
}) => {
  const handleToggle = useCallback(() => onToggle(courseId), [onToggle, courseId])

  return (
    <div className="min-w-0">
      <Button
        variant="ghost"
        className={`w-full justify-start text-left ${isMobile ? 'p-2 h-auto hover:bg-accent/30 rounded-md' : 'px-2 py-1.5 h-auto hover:bg-accent rounded-md'} touch-manipulation`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground flex-1">Topics</span>
          <span className="text-xs text-muted-foreground">{topics.length}</span>
        </div>
      </Button>

      {isExpanded && (
        <div className={`${isMobile ? 'ml-2 space-y-0.5 pr-0.5' : 'ml-2.5 space-y-0.5'} mt-1 min-w-0 border-l-2 border-primary/20 ${isMobile ? 'pl-2' : 'pl-2'}`}>
          {topics.map((topic, index) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              index={index}
              courseId={courseId}
              courseTitle={courseTitle}
              courseCode={courseCode}
              slides={slides[topic.id] || []}
              videos={videos[topic.id] || []}
              isExpanded={expandedTopicItems.has(topic.id)}
              onToggle={onToggleTopicItem}
              onContentClick={onContentClick}
              selectedContentId={selectedContentId}
              isMobile={isMobile}
              semesterInfo={semesterInfo}
            />
          ))}
        </div>
      )}
    </div>
  )
})

TopicsSection.displayName = "TopicsSection"

// Memoized Topic Item Component
interface TopicItemProps {
  topic: Topic
  index: number
  courseId: string
  courseTitle: string
  courseCode: string
  slides: Slide[]
  videos: Video[]
  isExpanded: boolean
  onToggle: (topicId: string, courseId: string) => void
  onContentClick: (type: any, title: string, url: string, id: string, topicTitle?: string, courseTitle?: string, description?: string, courseCode?: string, semesterInfo?: any) => void
  selectedContentId?: string
  isMobile?: boolean
  semesterInfo?: any
}

const TopicItem = memo<TopicItemProps>(({
  topic,
  index,
  courseId,
  courseTitle,
  courseCode,
  slides,
  videos,
  isExpanded,
  onToggle,
  onContentClick,
  selectedContentId,
  isMobile,
  semesterInfo,
}) => {
  const handleToggle = useCallback(() => onToggle(topic.id, courseId), [onToggle, topic.id, courseId])

  return (
    <div className="min-w-0 relative">
      <Button
        variant="ghost"
        className={`w-full justify-start text-left ${isMobile ? 'px-2 py-1.5 min-h-[36px]' : 'px-2 py-1.5'} h-auto min-w-0 rounded-md transition-all duration-150 group ${
          isExpanded
            ? 'bg-primary/8 dark:bg-primary/15'
            : 'hover:bg-accent/60'
        }`}
        onClick={handleToggle}
      >
        <div className={`flex items-center gap-2 w-full min-w-0`}>
          <div className={`transition-transform duration-150 ease-out ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
            <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 ${
              isExpanded ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
            }`} />
          </div>
          <div className={`flex items-center gap-2 flex-1 min-w-0`}>
            <div className={`flex-shrink-0 w-5 h-5 text-[10px] rounded-md flex items-center justify-center font-bold transition-colors ${
              isExpanded 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/70 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
            }`}>
              {index + 1}
            </div>
            <span className={`text-[12px] leading-snug break-words line-clamp-2 min-w-0 flex-1 transition-colors ${
              isExpanded ? "text-primary font-semibold" : "text-foreground font-medium group-hover:text-primary"
            }`}>
              {topic.title}
            </span>
          </div>
        </div>
      </Button>

      {isExpanded && (
        <div className={`${isMobile ? 'ml-5' : 'ml-6'} space-y-0.5 mt-1 mb-1 min-w-0 border-l-2 border-border/30 pl-2`}>
          {videos.map((video) => (
            <ContentItemButton
              key={video.id}
              type="video"
              id={video.id}
              title={video.title}
              url={video.youtube_url}
              topicTitle={topic.title}
              courseTitle={courseTitle}
              courseCode={courseCode}
              isSelected={selectedContentId === video.id}
              onContentClick={onContentClick}
              isMobile={isMobile}
              semesterInfo={semesterInfo}
            />
          ))}
          {slides.map((slide) => (
            <ContentItemButton
              key={slide.id}
              type="slide"
              id={slide.id}
              title={slide.title}
              url={slide.google_drive_url}
              topicTitle={topic.title}
              courseTitle={courseTitle}
              courseCode={courseCode}
              isSelected={selectedContentId === slide.id}
              onContentClick={onContentClick}
              isMobile={isMobile}
              semesterInfo={semesterInfo}
            />
          ))}
          {slides.length === 0 && videos.length === 0 && (
            <div className="text-center py-3 px-2">
              <FileText className="h-4 w-4 text-muted-foreground/40 mx-auto mb-1" />
              <div className="text-[11px] text-muted-foreground/60">No content available</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

TopicItem.displayName = "TopicItem"

// Memoized Content Item Button (for videos and slides)
interface ContentItemButtonProps {
  type: "video" | "slide"
  id: string
  title: string
  url: string
  topicTitle: string
  courseTitle: string
  courseCode: string
  isSelected: boolean
  onContentClick: (type: any, title: string, url: string, id: string, topicTitle?: string, courseTitle?: string, description?: string, courseCode?: string, semesterInfo?: any) => void
  isMobile?: boolean
  semesterInfo?: any
}

const ContentItemButton = memo<ContentItemButtonProps>(({
  type,
  id,
  title,
  url,
  topicTitle,
  courseTitle,
  courseCode,
  isSelected,
  onContentClick,
  isMobile,
  semesterInfo,
}) => {
  const handleClick = useCallback(() => {
    onContentClick(type, title, url, id, topicTitle, courseTitle, undefined, courseCode, semesterInfo)
  }, [type, title, url, id, topicTitle, courseTitle, courseCode, onContentClick, semesterInfo])

  const isVideo = type === "video"

  return (
    <Button
      variant="ghost"
      data-content-id={id}
      className={`w-full justify-start text-left ${isMobile ? 'px-2 py-1.5 min-h-[32px]' : 'px-2 py-1.5'} h-auto rounded-md min-w-0 transition-all duration-150 group ${
        isSelected
          ? isVideo 
            ? "bg-red-500/10 dark:bg-red-500/20"
            : "bg-blue-500/10 dark:bg-blue-500/20"
          : "hover:bg-accent/50"
      }`}
      onClick={handleClick}
    >
      <div className={`flex items-center gap-2 w-full min-w-0`}>
        <div className={`flex-shrink-0 p-1 rounded transition-colors ${
          isSelected 
            ? isVideo ? "bg-red-500/15 text-red-500" : "bg-blue-500/15 text-blue-500"
            : isVideo ? "text-red-400/80 group-hover:text-red-500" : "text-blue-400/80 group-hover:text-blue-500"
        }`}>
          {isVideo ? (
            <Play className="h-3 w-3 flex-shrink-0" />
          ) : (
            <FileText className="h-3 w-3 flex-shrink-0" />
          )}
        </div>
        <span className={`text-[11px] leading-snug break-words min-w-0 flex-1 line-clamp-2 transition-colors ${
          isSelected ? "font-semibold text-foreground" : "text-muted-foreground font-medium group-hover:text-foreground"
        }`}>
          {title}
        </span>
        {isSelected && (
          <div className={`flex-shrink-0 w-1.5 h-1.5 ${isVideo ? 'bg-red-500' : 'bg-blue-500'} rounded-full`} />
        )}
      </div>
    </Button>
  )
})

ContentItemButton.displayName = "ContentItemButton"
