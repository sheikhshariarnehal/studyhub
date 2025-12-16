"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronDown, ChevronRight, FileText, Play, BookOpen, Users, Search, Star, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import type { Database } from "@/lib/supabase"

type Semester = Database["public"]["Tables"]["semesters"]["Row"]
type Course = Database["public"]["Tables"]["courses"]["Row"]
type Topic = Database["public"]["Tables"]["topics"]["Row"]
type Slide = Database["public"]["Tables"]["slides"]["Row"]
type Video = Database["public"]["Tables"]["videos"]["Row"]
type StudyTool = Database["public"]["Tables"]["study_tools"]["Row"]

interface OptimizedSidebarProps {
  onContentSelect: (content: {
    type: "slide" | "video" | "document"
    title: string
    url: string
  }) => void
}

export function OptimizedSidebar({ onContentSelect }: OptimizedSidebarProps) {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemester, setSelectedSemester] = useState<string>("")
  const [courses, setCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set(["default-course"]))
  const [expandedStudyTools, setExpandedStudyTools] = useState<Set<string>>(new Set())
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(["default-course"]))
  const [expandedTopicItems, setExpandedTopicItems] = useState<Set<string>>(new Set(["topic-1", "topic-2"]))
  const [courseData, setCourseData] = useState<{
    [courseId: string]: {
      topics: Topic[]
      studyTools: StudyTool[]
      slides: { [topicId: string]: Slide[] }
      videos: { [topicId: string]: Video[] }
    }
  }>({})

  // Mock data for immediate display
  const mockData = useMemo(
    () => ({
      semesters: [
        { id: "summer-2025", title: "Summer 2025", description: "Summer semester 2025", section: "63_G" },
        { id: "spring-2025", title: "Spring 2025", description: "Spring semester 2025", section: "63_C" },
      ],
      courses: [
        {
          id: "default-course",
          title: "IOT",
          course_code: "CSE422",
          teacher_name: "Dr. Ahmed Rahman",
          semester_id: "summer-2025",
        },
      ],
      topics: [
        { id: "topic-1", title: "1 - Add New Topic", course_id: "default-course", order_index: 1 },
        { id: "topic-2", title: "2 - Add New Topic 2", course_id: "default-course", order_index: 2 },
      ],
      slides: [{ id: "slide-1", title: "slide", topic_id: "topic-2", google_drive_url: "#", order_index: 1 }],
      videos: [
        {
          id: "video-1",
          title: "video (0:00)",
          topic_id: "topic-2",
          youtube_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          order_index: 1,
        },
      ],
    }),
    [],
  )

  // Initialize with mock data
  useEffect(() => {
    setSemesters(mockData.semesters as any)
    setSelectedSemester("summer-2025")
    setCourses(mockData.courses as any)
    setCourseData({
      "default-course": {
        topics: mockData.topics as any,
        studyTools: [],
        slides: {
          "topic-2": mockData.slides as any,
        },
        videos: {
          "topic-2": mockData.videos as any,
        },
      },
    })
  }, [mockData])

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [courses, searchQuery])

  // Optimized toggle functions with useCallback
  const toggleCourse = useCallback((courseId: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }, [])

  const toggleStudyTools = useCallback((courseId: string) => {
    setExpandedStudyTools((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }, [])

  const toggleTopics = useCallback((courseId: string) => {
    setExpandedTopics((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }, [])

  const toggleTopicItem = useCallback((topicId: string) => {
    setExpandedTopicItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(topicId)) {
        newSet.delete(topicId)
      } else {
        newSet.add(topicId)
      }
      return newSet
    })
  }, [])

  const handleContentClick = useCallback(
    (type: "slide" | "video" | "document", title: string, url: string) => {
      onContentSelect({ type, title, url })
    },
    [onContentSelect],
  )

  const getStudyToolIcon = useCallback((type: string) => {
    switch (type) {
      case "previous_questions":
        return <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
      case "exam_note":
        return <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
      case "syllabus":
        return <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
      case "mark_distribution":
        return <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
      default:
        return <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-700">
        <h2 className="text-sm sm:text-base font-semibold text-white mb-3">Course Content</h2>

        {/* Semester Selection */}
        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger className="bg-slate-800 border-slate-600 text-white text-sm">
            <SelectValue placeholder="Select Semester" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id} className="text-white hover:bg-slate-700 text-sm">
                {semester.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="p-3 sm:p-4 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 text-sm h-8 sm:h-9"
          />
        </div>
      </div>

      {/* Course Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 sm:p-4 space-y-2">
          {filteredCourses.map((course) => (
            <div key={course.id} className="space-y-1">
              {/* Course Header */}
              <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-0 h-auto hover:bg-transparent"
                  onClick={() => toggleCourse(course.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {expandedCourses.has(course.id) ? (
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-slate-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-white truncate">{course.title}</div>
                      <div className="text-xs text-slate-400">({course.course_code})</div>
                      {courseData[course.id] && (
                        <div className="flex gap-1 sm:gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5">
                            {courseData[course.id].topics.length} Topics
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 px-1.5 py-0.5">
                            {courseData[course.id].slides
                              ? Object.values(courseData[course.id].slides).flat().length
                              : 0}{" "}
                            Slide
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 px-1.5 py-0.5">
                            {courseData[course.id].videos
                              ? Object.values(courseData[course.id].videos).flat().length
                              : 0}{" "}
                            Video
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              </div>

              {/* Course Content */}
              {expandedCourses.has(course.id) && courseData[course.id] && (
                <div className="ml-2 sm:ml-4 space-y-2">
                  {/* Topics Section */}
                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left p-2 h-auto hover:bg-slate-800 rounded-md"
                      onClick={() => toggleTopics(course.id)}
                    >
                      <div className="flex items-center gap-2">
                        {expandedTopics.has(course.id) ? (
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                        )}
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                        <span className="text-xs sm:text-sm text-white">Topics</span>
                      </div>
                    </Button>

                    {expandedTopics.has(course.id) && (
                      <div className="ml-4 sm:ml-6 space-y-1">
                        {courseData[course.id].topics.map((topic) => (
                          <div key={topic.id}>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-left p-2 h-auto hover:bg-slate-800 rounded-md"
                              onClick={() => toggleTopicItem(topic.id)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                {expandedTopicItems.has(topic.id) ? (
                                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                )}
                                <span className="text-xs sm:text-sm flex-1 text-slate-300 truncate">{topic.title}</span>
                              </div>
                            </Button>

                            {expandedTopicItems.has(topic.id) && (
                              <div className="ml-4 sm:ml-6 space-y-1">
                                {/* Slides */}
                                {courseData[course.id].slides[topic.id]?.map((slide) => (
                                  <Button
                                    key={slide.id}
                                    variant="ghost"
                                    className="w-full justify-start text-left p-2 h-auto hover:bg-slate-800 rounded-md touch-manipulation"
                                    onClick={() => handleContentClick("slide", slide.title, slide.google_drive_url)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                      <span className="text-xs text-slate-300 truncate">{slide.title}</span>
                                    </div>
                                  </Button>
                                ))}

                                {/* Videos */}
                                {courseData[course.id].videos[topic.id]?.map((video) => (
                                  <Button
                                    key={video.id}
                                    variant="ghost"
                                    className="w-full justify-start text-left p-2 h-auto hover:bg-slate-800 rounded-md touch-manipulation"
                                    onClick={() => handleContentClick("video", video.title, video.youtube_url)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Play className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                      <span className="text-xs text-slate-300 truncate">{video.title}</span>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-base sm:text-lg font-bold text-white">{filteredCourses.length}</div>
            <div className="text-xs text-slate-400">Courses</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-white">
              {Object.values(courseData).reduce(
                (acc, data) =>
                  acc + Object.values(data.slides).flat().length + Object.values(data.videos).flat().length,
                0,
              )}
            </div>
            <div className="text-xs text-slate-400">Content</div>
          </div>
        </div>
      </div>
    </div>
  )
}
