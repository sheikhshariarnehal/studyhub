"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, FileText, Play, BookOpen, Users, Search, Clock, Star, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

type Semester = Database["public"]["Tables"]["semesters"]["Row"]
type Course = Database["public"]["Tables"]["courses"]["Row"]
type Topic = Database["public"]["Tables"]["topics"]["Row"]
type Slide = Database["public"]["Tables"]["slides"]["Row"]
type Video = Database["public"]["Tables"]["videos"]["Row"]
type StudyTool = Database["public"]["Tables"]["study_tools"]["Row"]

interface SidebarProps {
  onContentSelect: (content: {
    type: "slide" | "video" | "document"
    title: string
    url: string
  }) => void
}

export function Sidebar({ onContentSelect }: SidebarProps) {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemester, setSelectedSemester] = useState<string>("")
  const [courses, setCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "video" | "slide" | "document">("all")
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedStudyTools, setExpandedStudyTools] = useState<Set<string>>(new Set())
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedTopicItems, setExpandedTopicItems] = useState<Set<string>>(new Set())
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [courseData, setCourseData] = useState<{
    [courseId: string]: {
      topics: Topic[]
      studyTools: StudyTool[]
      slides: { [topicId: string]: Slide[] }
      videos: { [topicId: string]: Video[] }
    }
  }>({})

  useEffect(() => {
    fetchSemesters()
  }, [])

  useEffect(() => {
    if (selectedSemester) {
      fetchCourses(selectedSemester)
    }
  }, [selectedSemester])

  const fetchSemesters = async () => {
    const { data, error } = await supabase.from("semesters").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching semesters:", error)
      return
    }

    setSemesters(data || [])
    if (data && data.length > 0) {
      // Auto-select the first active semester, or fallback to the first semester
      const activeSemester = data.find(semester => semester.is_active === true)
      const semesterToSelect = activeSemester || data[0]
      setSelectedSemester(semesterToSelect.id)
    }
  }

  const fetchCourses = async (semesterId: string) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("semester_id", semesterId)
      .order("is_highlighted", { ascending: false }) // Highlighted courses first
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching courses:", error)
      return
    }

    setCourses(data || [])
  }

  const fetchCourseData = async (courseId: string) => {
    if (courseData[courseId]) return

    // Fetch topics
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true })

    // Fetch study tools
    const { data: studyTools, error: studyToolsError } = await supabase
      .from("study_tools")
      .select("*")
      .eq("course_id", courseId)

    if (topicsError || studyToolsError) {
      console.error("Error fetching course data:", topicsError || studyToolsError)
      return
    }

    // Fetch slides and videos for each topic
    const slides: { [topicId: string]: Slide[] } = {}
    const videos: { [topicId: string]: Video[] } = {}

    for (const topic of topics || []) {
      const { data: topicSlides } = await supabase
        .from("slides")
        .select("*")
        .eq("topic_id", topic.id)
        .order("order_index", { ascending: true })

      const { data: topicVideos } = await supabase
        .from("videos")
        .select("*")
        .eq("topic_id", topic.id)
        .order("order_index", { ascending: true })

      slides[topic.id] = topicSlides || []
      videos[topic.id] = topicVideos || []
    }

    setCourseData((prev) => ({
      ...prev,
      [courseId]: {
        topics: topics || [],
        studyTools: studyTools || [],
        slides,
        videos,
      },
    }))
  }

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
      fetchCourseData(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const toggleStudyTools = (courseId: string) => {
    const newExpanded = new Set(expandedStudyTools)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedStudyTools(newExpanded)
  }

  const toggleTopics = (courseId: string) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedTopics(newExpanded)
  }

  const toggleTopicItem = (topicId: string) => {
    const newExpanded = new Set(expandedTopicItems)
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId)
    } else {
      newExpanded.add(topicId)
    }
    setExpandedTopicItems(newExpanded)
  }

  const toggleCompleted = (itemId: string) => {
    const newCompleted = new Set(completedItems)
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId)
    } else {
      newCompleted.add(itemId)
    }
    setCompletedItems(newCompleted)
  }

  const handleContentClick = (type: "slide" | "video" | "document", title: string, url: string) => {
    onContentSelect({ type, title, url })
  }

  const getStudyToolIcon = (type: string) => {
    switch (type) {
      case "previous_questions":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "exam_note":
        return <BookOpen className="h-4 w-4 text-green-500" />
      case "syllabus":
        return <FileText className="h-4 w-4 text-purple-500" />
      case "mark_distribution":
        return <BarChart3 className="h-4 w-4 text-orange-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStudyToolLabel = (type: string) => {
    switch (type) {
      case "previous_questions":
        return "Previous Questions"
      case "exam_note":
        return "Exam Notes"
      case "syllabus":
        return "Syllabus"
      case "mark_distribution":
        return "Mark Distribution"
      default:
        return type
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getCourseProgress = (courseId: string) => {
    if (!courseData[courseId]) return 0

    const totalItems =
      courseData[courseId].topics.length +
      Object.values(courseData[courseId].slides).flat().length +
      Object.values(courseData[courseId].videos).flat().length +
      courseData[courseId].studyTools.length

    if (totalItems === 0) return 0

    const completedCount = Array.from(completedItems).filter((id) => id.startsWith(courseId)).length

    return Math.round((completedCount / totalItems) * 100)
  }

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <CardHeader className="p-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Content
          </CardTitle>
        </CardHeader>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 border-b">
        {/* Semester Selection */}
        <div>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
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

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="video">Videos Only</SelectItem>
              <SelectItem value="slide">Slides Only</SelectItem>
              <SelectItem value="document">Documents Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No courses found</p>
              {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="mt-2">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredCourses.map((course) => {
              const progress = getCourseProgress(course.id)
              const totalItems = courseData[course.id]
                ? courseData[course.id].topics.length +
                  Object.values(courseData[course.id].slides).flat().length +
                  Object.values(courseData[course.id].videos).flat().length +
                  courseData[course.id].studyTools.length
                : 0

              return (
                <Card key={course.id} className={`overflow-hidden transition-all duration-500 ease-out ${
                  course.is_highlighted
                    ? `border-l-4 border-l-blue-500 dark:border-l-[#50727B]
                       bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20
                       border border-blue-200/60
                       shadow-[0_2px_8px_-2px_rgba(59,130,246,0.15),0_4px_16px_-4px_rgba(59,130,246,0.1)]
                       hover:shadow-[0_8px_25px_-5px_rgba(59,130,246,0.25),0_8px_16px_-8px_rgba(59,130,246,0.15)]
                       hover:border-blue-300/70 hover:-translate-y-0.5
                       dark:bg-gradient-to-br dark:from-[#35374B]/90 dark:via-[#344955]/60 dark:to-[#50727B]/30
                       dark:border-[#50727B]/60 dark:shadow-[0_4px_12px_-2px_rgba(80,114,123,0.4),0_8px_24px_-4px_rgba(53,55,75,0.5)]
                       dark:hover:shadow-[0_8px_25px_-5px_rgba(80,114,123,0.5),0_12px_32px_-8px_rgba(53,55,75,0.6)]
                       dark:hover:border-[#50727B]/80 dark:hover:shadow-[0_0_30px_rgba(80,114,123,0.3)]`
                    : 'hover:shadow-md dark:hover:shadow-[0_4px_12px_-2px_rgba(53,55,75,0.4)]'
                }`}>
                  <CardContent className="p-0">
                    {/* Course Header */}
                    <div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left p-4 h-auto hover:bg-muted/50 rounded-none"
                        onClick={() => toggleCourse(course.id)}
                      >
                      <div className="flex items-center gap-3 w-full">
                        {expandedCourses.has(course.id) ? (
                          <ChevronDown className={`h-4 w-4 shrink-0 transition-colors ${
                            course.is_highlighted ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                          }`} />
                        ) : (
                          <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${
                            course.is_highlighted ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                          }`} />
                        )}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`font-bold text-sm truncate flex-1 tracking-tight ${
                              course.is_highlighted ? 'text-slate-800 dark:text-slate-100' : ''
                            }`}>
                              {course.title}
                            </div>
                            {course.is_highlighted && (
                              <Star className="h-4 w-4 text-emerald-500 fill-emerald-500 drop-shadow-sm dark:text-[#78A083] dark:fill-[#78A083] dark:drop-shadow-[0_2px_4px_rgba(120,160,131,0.4)]" />
                            )}
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                            course.is_highlighted
                              ? `bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200/60 shadow-sm
                                 dark:bg-gradient-to-r dark:from-[#50727B]/60 dark:to-[#344955]/80
                                 dark:text-[#78A083] dark:border-[#50727B]/40
                                 dark:shadow-[0_2px_8px_-2px_rgba(80,114,123,0.4)]`
                              : 'text-muted-foreground bg-muted/50 dark:bg-[#344955]/30 dark:text-muted-foreground'
                          }`}>
                            {course.course_code}
                          </div>

                          {courseData[course.id] && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {Array.from(completedItems).filter((id) => id.startsWith(course.id)).length} /{" "}
                                  {totalItems} completed
                                </span>
                                <span className="text-muted-foreground">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                    </div>

                    {/* Course Content */}
                    {expandedCourses.has(course.id) && courseData[course.id] && (
                      <div className="border-t bg-muted/20">
                        <div className="p-4 space-y-3">
                          {/* Study Tools Section */}
                          {courseData[course.id].studyTools.length > 0 && (
                            <div>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-left p-2 h-auto hover:bg-muted/50 rounded-md"
                                onClick={() => toggleStudyTools(course.id)}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  {expandedStudyTools.has(course.id) ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <BookOpen className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium flex-1">Study Resources</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {courseData[course.id].studyTools.length}
                                  </Badge>
                                </div>
                              </Button>

                              {expandedStudyTools.has(course.id) && (
                                <div className="ml-6 space-y-1 mt-2">
                                  {courseData[course.id].studyTools.map((tool) => (
                                    <div
                                      key={tool.id}
                                      className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md"
                                    >
                                      <Checkbox
                                        checked={completedItems.has(`${course.id}-tool-${tool.id}`)}
                                        onCheckedChange={() => toggleCompleted(`${course.id}-tool-${tool.id}`)}
                                      />
                                      <Button
                                        variant="ghost"
                                        className="flex-1 justify-start text-left p-0 h-auto"
                                        onClick={() =>
                                          tool.content_url &&
                                          handleContentClick("document", tool.title, tool.content_url)
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          {getStudyToolIcon(tool.type)}
                                          <span className="text-xs truncate">{getStudyToolLabel(tool.type)}</span>
                                        </div>
                                      </Button>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>5min</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Topics Section */}
                          {courseData[course.id].topics.map((topic, sectionIndex) => {
                            const topicSlides = courseData[course.id].slides[topic.id] || []
                            const topicVideos = courseData[course.id].videos[topic.id] || []
                            const totalTopicItems = topicSlides.length + topicVideos.length

                            return (
                              <div key={topic.id}>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start text-left p-2 h-auto hover:bg-muted/50 rounded-md"
                                  onClick={() => toggleTopicItem(topic.id)}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {expandedTopicItems.has(topic.id) ? (
                                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    <span
                                      className="text-xs font-medium flex-1 truncate"
                                      title={`Section ${sectionIndex + 1}: ${topic.title}`}
                                    >
                                      Section {sectionIndex + 1}: {topic.title}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {totalTopicItems}
                                    </Badge>
                                  </div>
                                </Button>

                                {expandedTopicItems.has(topic.id) && (
                                  <div className="ml-6 space-y-1 mt-1">
                                    {/* Videos */}
                                    {topicVideos.map((video, index) => (
                                      <div
                                        key={video.id}
                                        className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md"
                                      >
                                        <Checkbox
                                          checked={completedItems.has(`${course.id}-video-${video.id}`)}
                                          onCheckedChange={() => toggleCompleted(`${course.id}-video-${video.id}`)}
                                        />
                                        <Button
                                          variant="ghost"
                                          className="flex-1 justify-start text-left p-0 h-auto group"
                                          onClick={() => handleContentClick("video", video.title, video.youtube_url)}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Play className="h-3 w-3 text-red-500" />
                                            <span className="text-xs text-muted-foreground group-hover:text-foreground truncate">
                                              {index + 1}. {video.title}
                                            </span>
                                          </div>
                                        </Button>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          <span>3min</span>
                                        </div>
                                      </div>
                                    ))}

                                    {/* Slides */}
                                    {topicSlides.map((slide, index) => (
                                      <div
                                        key={slide.id}
                                        className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md"
                                      >
                                        <Checkbox
                                          checked={completedItems.has(`${course.id}-slide-${slide.id}`)}
                                          onCheckedChange={() => toggleCompleted(`${course.id}-slide-${slide.id}`)}
                                        />
                                        <Button
                                          variant="ghost"
                                          className="flex-1 justify-start text-left p-0 h-auto group"
                                          onClick={() =>
                                            handleContentClick("slide", slide.title, slide.google_drive_url)
                                          }
                                        >
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-blue-500" />
                                            <span className="text-xs text-muted-foreground group-hover:text-foreground truncate">
                                              {topicVideos.length + index + 1}. {slide.title}
                                            </span>
                                          </div>
                                        </Button>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          <span>5min</span>
                                        </div>
                                      </div>
                                    ))}

                                    {totalTopicItems === 0 && (
                                      <div className="text-xs text-muted-foreground py-2 pl-2">
                                        No content available
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
