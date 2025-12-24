"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { generateDemoSemester } from "@/utils/semester-demo-data"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  ArrowLeft,
  Loader2,
  BookOpen,
  FileText,
  Video,
  PresentationIcon,
  ClipboardList,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Building2,
  Users,
  Info
} from "lucide-react"

// User context interface
interface UserContext {
  id: string
  role: string
  full_name: string
  department_id: string | null
  batch_id: string | null
  department?: { id: string; name: string; short_name: string } | null
  batch?: { id: string; batch_name: string; batch_number: number } | null
  is_approved: boolean
}

// Interfaces
interface SemesterData {
  title: string
  description: string
  section: string
  has_midterm: boolean
  has_final: boolean
  start_date?: string
  end_date?: string
  default_credits?: number
  is_active?: boolean
}

interface CourseData {
  id?: string
  title: string
  course_code: string
  teacher_name: string
  teacher_email?: string
  credits?: number
  description?: string
  is_highlighted?: boolean
  topics: TopicData[]
  studyTools: StudyToolData[]
}

interface TopicData {
  id?: string
  title: string
  description: string
  order_index?: number
  slides: { id?: string; title: string; url: string; description?: string }[]
  videos: { id?: string; title: string; url: string; description?: string }[]
}

interface StudyToolData {
  id?: string
  title: string
  type: string
  content_url: string
  exam_type: string
  description?: string
}

interface AllInOneData {
  semester: SemesterData
  courses: CourseData[]
}

// Study Tool Card Component with Drag-and-Drop
function StudyToolCard({ tool, toolIndex, courseIndex, isExpanded, onToggle, onRemove, onUpdate }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `studytool-${courseIndex}-${toolIndex}` 
  })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getToolIcon = (type: string) => {
    switch(type) {
      case 'previous_questions': return '📝'
      case 'exam_note': return '📚'
      case 'syllabus': return '📋'
      case 'mark_distribution': return '📊'
      default: return '📄'
    }
  }

  const getToolTypeLabel = (type: string) => {
    switch(type) {
      case 'previous_questions': return 'Previous Questions'
      case 'exam_note': return 'Exam Notes'
      case 'syllabus': return 'Syllabus'
      case 'mark_distribution': return 'Mark Distribution'
      default: return 'Document'
    }
  }

  return (
    <Card ref={setNodeRef} style={style} className={`border-l-4 ${isDragging ? 'border-l-blue-500 shadow-xl' : 'border-l-blue-400 dark:border-l-blue-600'} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-accent rounded-md transition-colors flex-shrink-0">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div 
            className="flex-1 flex items-center justify-between cursor-pointer hover:bg-accent/50 -m-2 p-2 rounded-md transition-colors min-w-0"
            onClick={onToggle}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">{getToolIcon(tool.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                  {tool.title || "Untitled Tool"}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{getToolTypeLabel(tool.type)}</span>
                  {tool.exam_type && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{tool.exam_type}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="p-1">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }} 
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                Title <span className="text-red-500 text-xs">*</span>
              </Label>
              <Input 
                placeholder="e.g., Midterm Question Bank 2024" 
                value={tool.title} 
                onChange={(e) => onUpdate("title", e.target.value)} 
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-600 h-11" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Type</Label>
              <Select value={tool.type} onValueChange={(value) => onUpdate("type", value)}>
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-11">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_questions">📝 Previous Questions</SelectItem>
                  <SelectItem value="exam_note">📚 Exam Notes</SelectItem>
                  <SelectItem value="syllabus">📋 Syllabus</SelectItem>
                  <SelectItem value="mark_distribution">📊 Mark Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                Content URL <span className="text-red-500 text-xs">*</span>
              </Label>
              <Input 
                placeholder="https://drive.google.com/..." 
                value={tool.content_url} 
                onChange={(e) => onUpdate("content_url", e.target.value)} 
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-600 h-11" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Exam Type</Label>
              <Select value={tool.exam_type} onValueChange={(value) => onUpdate("exam_type", value)}>
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-11">
                  <SelectValue placeholder="Select exam type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midterm">🎯 Midterm</SelectItem>
                  <SelectItem value="final">🏆 Final</SelectItem>
                  <SelectItem value="both">✨ Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description (Optional)</Label>
            <Textarea 
              placeholder="Add additional details about this study tool..." 
              value={tool.description} 
              onChange={(e) => onUpdate("description", e.target.value)} 
              rows={2} 
              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-600 resize-none" 
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Sortable Topic Component
function SortableTopic({
  topic,
  topicIndex,
  courseIndex,
  isExpanded,
  onToggle,
  onRemove,
  onUpdate,
  onAddSlide,
  onRemoveSlide,
  onUpdateSlide,
  onAddVideo,
  onRemoveVideo,
  onUpdateVideo,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `topic-${courseIndex}-${topicIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-l-4 ${isDragging ? 'border-l-purple-500 shadow-xl' : 'border-l-purple-300'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-accent rounded-md transition-colors"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div 
            className="flex-1 flex items-center justify-between cursor-pointer hover:bg-accent/50 -m-2 p-2 rounded-md transition-colors"
            onClick={onToggle}
          >
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-semibold">
                Topic {topicIndex + 1}
              </Badge>
              <span className="font-semibold text-base">
                {topic.title || "Untitled Topic"}
              </span>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <PresentationIcon className="h-3 w-3" />
                  {topic.slides.length}
                </span>
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {topic.videos.length}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                Topic Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g., Introduction to Machine Learning"
                value={topic.title}
                onChange={(e) => onUpdate("title", e.target.value)}
                className="h-10 dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Order Index</Label>
              <Input
                type="number"
                min="0"
                value={topic.order_index || 0}
                onChange={(e) => onUpdate("order_index", parseInt(e.target.value) || 0)}
                className="h-10 dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description</Label>
            <Textarea
              placeholder="Describe what students will learn in this topic..."
              value={topic.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              rows={3}
              className="resize-none dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600"
            />
          </div>

          <Separator />

          {/* Slides Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <PresentationIcon className="h-4 w-4 text-blue-600" />
                Slides ({topic.slides.length})
              </h4>
              <Button
                onClick={onAddSlide}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Slide
              </Button>
            </div>
            {topic.slides.map((slide: any, slideIndex: number) => (
              <div key={slideIndex} className="grid gap-3 p-4 border rounded-lg bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Slide title"
                    value={slide.title}
                    onChange={(e) => onUpdateSlide(slideIndex, "title", e.target.value)}
                    className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600"
                  />
                  <Input
                    placeholder="Google Drive/Docs URL"
                    value={slide.url}
                    onChange={(e) => onUpdateSlide(slideIndex, "url", e.target.value)}
                    className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Description (optional)"
                    value={slide.description || ""}
                    onChange={(e) => onUpdateSlide(slideIndex, "description", e.target.value)}
                    className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveSlide(slideIndex)}
                    className="h-9 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Videos Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-600" />
                Videos ({topic.videos.length})
              </h4>
              <Button
                onClick={onAddVideo}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Video
              </Button>
            </div>
            {topic.videos.map((video: any, videoIndex: number) => (
              <div key={videoIndex} className="grid gap-3 p-4 border rounded-lg bg-purple-50/30 dark:bg-purple-950/20 dark:border-purple-800">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Video title"
                    value={video.title}
                    onChange={(e) => onUpdateVideo(videoIndex, "title", e.target.value)}
                    className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600"
                  />
                  <Input
                    placeholder="YouTube/Video URL"
                    value={video.url}
                    onChange={(e) => onUpdateVideo(videoIndex, "url", e.target.value)}
                    className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Description (optional)"
                    value={video.description || ""}
                    onChange={(e) => onUpdateVideo(videoIndex, "description", e.target.value)}
                    className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveVideo(videoIndex)}
                    className="h-9 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function CreateBulkCreatorPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<{ courseIndex: number; topicIndex: number } | null>(null)
  const [expandedStudyTool, setExpandedStudyTool] = useState<{ courseIndex: number; toolIndex: number } | null>(null)
  const [formData, setFormData] = useState<AllInOneData>({
    semester: {
      title: "",
      description: "",
      section: "",
      has_midterm: true,
      has_final: true,
      start_date: "",
      end_date: "",
      default_credits: 3,
      is_active: true
    },
    courses: []
  })

  // Check if user is a contributor
  const isContributor = userContext?.role === "contributor"
  const isAdmin = ["super_admin", "admin", "moderator", "content_creator", "section_admin"].includes(userContext?.role || "")
  
  // Check if contributor has required context
  const contributorHasContext = isContributor && userContext?.department_id && userContext?.batch_id
  const contributorMissingContext = isContributor && (!userContext?.department_id || !userContext?.batch_id)
  const contributorNotApproved = isContributor && !userContext?.is_approved

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include",
        })
        const data = await response.json()
        if (data.success && data.user) {
          // Map API response to UserContext format
          setUserContext({
            ...data.user,
            department: data.user.departments, // API returns 'departments', we need 'department'
            batch: data.user.batches, // API returns 'batches', we need 'batch'
          })
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast.error("Failed to load user profile")
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent, courseIndex: number) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeIndex = parseInt(active.id.toString().split('-')[2])
    const overIndex = parseInt(over.id.toString().split('-')[2])

    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? { ...course, topics: arrayMove(course.topics, activeIndex, overIndex) }
          : course
      )
    }))
  }

  const handleStudyToolDragEnd = (event: DragEndEvent, courseIndex: number) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIndex = parseInt(active.id.toString().split('-')[2])
    const overIndex = parseInt(over.id.toString().split('-')[2])

    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex ? { ...course, studyTools: arrayMove(course.studyTools || [], activeIndex, overIndex) } : course
      )
    }))
  }

  // Load demo data
  const loadDemoData = () => {
    const demoData = generateDemoSemester()
    setFormData(demoData)
    setExpandedCourse(0)
    toast.success("✨ Demo data loaded! Review and customize as needed.")
  }

  // Course management
  const addCourse = () => {
    setFormData(prev => ({
      ...prev,
      courses: [
        ...prev.courses,
        {
          title: "",
          course_code: "",
          teacher_name: "",
          teacher_email: "",
          credits: 3,
          description: "",
          is_highlighted: false,
          topics: [],
          studyTools: []
        }
      ]
    }))
    setExpandedCourse(formData.courses.length)
  }

  const removeCourse = (index: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }))
    if (expandedCourse === index) setExpandedCourse(null)
    toast.success("Course removed")
  }

  const updateCourse = (index: number, field: keyof CourseData, value: any) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === index ? { ...course, [field]: value } : course
      )
    }))
  }

  // Topic management
  const addTopic = (courseIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              topics: [
                ...course.topics,
                { title: "", description: "", order_index: course.topics.length, slides: [], videos: [] }
              ]
            }
          : course
      )
    }))
    setExpandedTopic({ courseIndex, topicIndex: formData.courses[courseIndex].topics.length })
  }

  const removeTopic = (courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? { ...course, topics: course.topics.filter((_, j) => j !== topicIndex) }
          : course
      )
    }))
    toast.success("Topic removed")
  }

  const updateTopic = (courseIndex: number, topicIndex: number, field: keyof TopicData, value: any) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              topics: course.topics.map((topic, j) =>
                j === topicIndex ? { ...topic, [field]: value } : topic
              )
            }
          : course
      )
    }))
  }

  // Slide management
  const addSlide = (courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              topics: course.topics.map((topic, j) =>
                j === topicIndex
                  ? { ...topic, slides: [...topic.slides, { title: "", url: "", description: "" }] }
                  : topic
              )
            }
          : course
      )
    }))
  }

  const removeSlide = (courseIndex: number, topicIndex: number, slideIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              topics: course.topics.map((topic, j) =>
                j === topicIndex
                  ? { ...topic, slides: topic.slides.filter((_, k) => k !== slideIndex) }
                  : topic
              )
            }
          : course
      )
    }))
  }

  const updateSlide = (courseIndex: number, topicIndex: number, slideIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              topics: course.topics.map((topic, j) =>
                j === topicIndex
                  ? {
                      ...topic,
                      slides: topic.slides.map((slide, k) =>
                        k === slideIndex ? { ...slide, [field]: value } : slide
                      )
                    }
                  : topic
              )
            }
          : course
      )
    }))
  }

  // Video management
  const addVideo = (courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              topics: course.topics.map((topic, j) =>
                j === topicIndex
                  ? { ...topic, videos: [...topic.videos, { title: "", url: "", description: "" }] }
                  : topic
              )
            }
          : course
      )
    }))
  }

  const removeVideo = (courseIndex: number, topicIndex: number, videoIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              topics: course.topics.map((topic, j) =>
                j === topicIndex
                  ? { ...topic, videos: topic.videos.filter((_, k) => k !== videoIndex) }
                  : topic
              )
            }
          : course
      )
    }))
  }

  const updateVideo = (courseIndex: number, topicIndex: number, videoIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              topics: course.topics.map((topic, j) =>
                j === topicIndex
                  ? {
                      ...topic,
                      videos: topic.videos.map((video, k) =>
                        k === videoIndex ? { ...video, [field]: value } : video
                      )
                    }
                  : topic
              )
            }
          : course
      )
    }))
  }

  // Study tool management
  const addStudyTool = (courseIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              studyTools: [
                ...course.studyTools,
                { title: "", type: "previous_questions", content_url: "", exam_type: "both", description: "" }
              ]
            }
          : course
      )
    }))
  }

  const removeStudyTool = (courseIndex: number, toolIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? { ...course, studyTools: course.studyTools.filter((_, j) => j !== toolIndex) }
          : course
      )
    }))
  }

  const updateStudyTool = (courseIndex: number, toolIndex: number, field: keyof StudyToolData, value: any) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex
          ? {
              ...course,
              studyTools: course.studyTools.map((tool, j) =>
                j === toolIndex ? { ...tool, [field]: value } : tool
              )
            }
          : course
      )
    }))
  }

  // Validation
  const validateForm = (): boolean => {
    if (!formData.semester.title.trim()) {
      toast.error("Semester title is required")
      return false
    }
    if (!formData.semester.section.trim()) {
      toast.error("Section is required")
      return false
    }
    if (formData.courses.length === 0) {
      toast.error("At least one course is required")
      return false
    }
    
    for (let i = 0; i < formData.courses.length; i++) {
      const course = formData.courses[i]
      if (!course.title.trim()) {
        toast.error(`Course ${i + 1}: Title is required`)
        return false
      }
      if (!course.course_code.trim()) {
        toast.error(`Course ${i + 1}: Course code is required`)
        return false
      }
      if (!course.teacher_name.trim()) {
        toast.error(`Course ${i + 1}: Teacher name is required`)
        return false
      }
    }
    
    return true
  }

  // Check if form can be submitted
  const canSubmit = !isLoadingUser && !contributorNotApproved && !contributorMissingContext

  // Submit
  const handleSubmit = async () => {
    if (!canSubmit) {
      if (contributorNotApproved) {
        toast.error("Your account is pending approval")
        return
      }
      if (contributorMissingContext) {
        toast.error("Your account must be assigned to a department and batch")
        return
      }
      return
    }
    
    if (!validateForm()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/all-in-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create semester')
      }

      const result = await response.json()
      toast.success("✅ Semester created successfully!")
      router.push('/dashboard/create/bulk')
    } catch (error: any) {
      console.error('Error creating semester:', error)
      toast.error(error.message || 'Failed to create semester')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/create/bulk')}
            className="h-10 w-10 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Create New Semester
                </h1>
                <p className="text-sm text-muted-foreground">
                  Build a complete semester with courses, topics, materials, and study tools
                </p>
              </div>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={loadDemoData}
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={contributorNotApproved || contributorMissingContext}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Load Demo
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Load sample data to see how it works</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingUser && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {/* Contributor Context Banner */}
      {!isLoadingUser && isContributor && (
        <div className="mb-6 space-y-4">
          {/* Show department/batch context */}
          {contributorHasContext && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">Creating content for your section</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{userContext?.department?.short_name || userContext?.department?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{userContext?.batch?.batch_name}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  All content you create will be associated with your department and batch.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning: Missing department/batch */}
          {contributorMissingContext && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription>
                Your account is not yet assigned to a department and batch. Please contact an administrator to complete your account setup before creating content.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning: Not approved */}
          {contributorNotApproved && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Account Pending Approval</AlertTitle>
              <AlertDescription>
                Your account is pending approval. You will be able to create content once an administrator approves your account.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Admin Info Banner */}
      {!isLoadingUser && isAdmin && (
        <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900 dark:text-green-100">Admin Access</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            As an admin, you can create content that is available globally across all departments and batches.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Semester Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Semester Information</CardTitle>
                <CardDescription>Basic details about the semester</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Semester Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., Fall 2025"
                  value={formData.semester.title}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    semester: { ...prev.semester, title: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Section <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., 63 G"
                  value={formData.semester.section}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    semester: { ...prev.semester, section: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                placeholder="Describe the semester..."
                value={formData.semester.description}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  semester: { ...prev.semester, description: e.target.value }
                }))}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <Input
                  type="date"
                  value={formData.semester.start_date}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    semester: { ...prev.semester, start_date: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date</Label>
                <Input
                  type="date"
                  value={formData.semester.end_date}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    semester: { ...prev.semester, end_date: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Credits</Label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.semester.default_credits}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    semester: { ...prev.semester, default_credits: parseInt(e.target.value) || 3 }
                  }))}
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.semester.has_midterm}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    semester: { ...prev.semester, has_midterm: checked }
                  }))}
                />
                <Label className="text-sm cursor-pointer">Has Midterm Exam</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.semester.has_final}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    semester: { ...prev.semester, has_final: checked }
                  }))}
                />
                <Label className="text-sm cursor-pointer">Has Final Exam</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.semester.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    semester: { ...prev.semester, is_active: checked }
                  }))}
                />
                <Label className="text-sm cursor-pointer">Set as Active</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Courses
                    <Badge variant="secondary">{formData.courses.length}</Badge>
                  </CardTitle>
                  <CardDescription>Add courses with topics and materials</CardDescription>
                </div>
              </div>
              <Button onClick={addCourse} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.courses.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-muted-foreground mb-4">No courses added yet</p>
                <Button onClick={addCourse} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Course
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.courses.map((course, courseIndex) => (
                  <Card key={courseIndex}>
                    <CardHeader className="pb-3">
                      <div 
                        className="flex items-center justify-between gap-3 cursor-pointer"
                        onClick={() => setExpandedCourse(expandedCourse === courseIndex ? null : courseIndex)}
                      >
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                          <Badge variant="secondary" className="shrink-0">Course {courseIndex + 1}</Badge>
                          <span className="font-semibold truncate">
                            {course.title || "Untitled Course"}
                          </span>
                          {course.course_code && (
                            <Badge variant="outline" className="font-mono text-xs shrink-0">
                              {course.course_code}
                            </Badge>
                          )}
                          {course.is_highlighted && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                          )}
                          <div className="flex gap-2 text-xs text-muted-foreground ml-auto">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {course.topics.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClipboardList className="h-3 w-3" />
                              {course.studyTools.length}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {expandedCourse === courseIndex ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeCourse(courseIndex)
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {expandedCourse === courseIndex && (
                      <CardContent className="space-y-6 pt-0">
                        <Separator />
                        
                        {/* Course Basic Info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="e.g., Data Structures"
                              value={course.title}
                              onChange={(e) => updateCourse(courseIndex, "title", e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              Course Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="e.g., CSE201"
                              value={course.course_code}
                              onChange={(e) => updateCourse(courseIndex, "course_code", e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              Teacher Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="e.g., Dr. John Doe"
                              value={course.teacher_name}
                              onChange={(e) => updateCourse(courseIndex, "teacher_name", e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Teacher Email</Label>
                            <Input
                              placeholder="teacher@example.com"
                              type="email"
                              value={course.teacher_email}
                              onChange={(e) => updateCourse(courseIndex, "teacher_email", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Credits</Label>
                            <Input
                              type="number"
                              min="1"
                              max="6"
                              value={course.credits}
                              onChange={(e) => updateCourse(courseIndex, "credits", parseInt(e.target.value) || 3)}
                            />
                          </div>
                          <div className="space-y-2 flex items-end">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={course.is_highlighted}
                                onCheckedChange={(checked) => updateCourse(courseIndex, "is_highlighted", checked)}
                              />
                              <Label className="flex items-center gap-2 cursor-pointer">
                                <Star className="h-4 w-4" />
                                Highlight Course
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Course description..."
                            value={course.description}
                            onChange={(e) => updateCourse(courseIndex, "description", e.target.value)}
                            rows={2}
                          />
                        </div>

                        <Separator />

                        {/* Topics Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-600" />
                              Topics ({course.topics.length})
                            </h4>
                            <Button
                              onClick={() => addTopic(courseIndex)}
                              size="sm"
                              variant="outline"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Topic
                            </Button>
                          </div>

                          {course.topics.length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleDragEnd(event, courseIndex)}
                            >
                              <SortableContext
                                items={course.topics.map((_, i) => `topic-${courseIndex}-${i}`)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {course.topics.map((topic, topicIndex) => (
                                    <SortableTopic
                                      key={topicIndex}
                                      topic={topic}
                                      topicIndex={topicIndex}
                                      courseIndex={courseIndex}
                                      isExpanded={
                                        expandedTopic?.courseIndex === courseIndex &&
                                        expandedTopic?.topicIndex === topicIndex
                                      }
                                      onToggle={() => {
                                        if (
                                          expandedTopic?.courseIndex === courseIndex &&
                                          expandedTopic?.topicIndex === topicIndex
                                        ) {
                                          setExpandedTopic(null)
                                        } else {
                                          setExpandedTopic({ courseIndex, topicIndex })
                                        }
                                      }}
                                      onRemove={() => removeTopic(courseIndex, topicIndex)}
                                      onUpdate={(field: string, value: any) =>
                                        updateTopic(courseIndex, topicIndex, field as keyof TopicData, value)
                                      }
                                      onAddSlide={() => addSlide(courseIndex, topicIndex)}
                                      onRemoveSlide={(slideIndex: number) =>
                                        removeSlide(courseIndex, topicIndex, slideIndex)
                                      }
                                      onUpdateSlide={(slideIndex: number, field: string, value: string) =>
                                        updateSlide(courseIndex, topicIndex, slideIndex, field, value)
                                      }
                                      onAddVideo={() => addVideo(courseIndex, topicIndex)}
                                      onRemoveVideo={(videoIndex: number) =>
                                        removeVideo(courseIndex, topicIndex, videoIndex)
                                      }
                                      onUpdateVideo={(videoIndex: number, field: string, value: string) =>
                                        updateVideo(courseIndex, topicIndex, videoIndex, field, value)
                                      }
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>

                        <Separator />

                        {/* Study Tools Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <ClipboardList className="h-4 w-4 text-blue-600" />
                              Study Tools ({course.studyTools.length})
                            </h4>
                            <Button
                              onClick={() => addStudyTool(courseIndex)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Tool
                            </Button>
                          </div>

                          {course.studyTools.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/30 dark:bg-blue-950/20">
                              <ClipboardList className="h-12 w-12 text-blue-300 dark:text-blue-600 mx-auto mb-3" />
                              <p className="text-sm text-muted-foreground mb-3">No study tools added yet</p>
                              <Button 
                                onClick={() => addStudyTool(courseIndex)} 
                                size="sm" 
                                variant="outline"
                                className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Your First Tool
                              </Button>
                            </div>
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event: DragEndEvent) => handleStudyToolDragEnd(event, courseIndex)}
                            >
                              <SortableContext
                                items={course.studyTools.map((_, idx) => `studytool-${courseIndex}-${idx}`)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {course.studyTools.map((tool, toolIndex) => (
                                    <StudyToolCard
                                      key={toolIndex}
                                      tool={tool}
                                      toolIndex={toolIndex}
                                      courseIndex={courseIndex}
                                      isExpanded={
                                        expandedStudyTool?.courseIndex === courseIndex &&
                                        expandedStudyTool?.toolIndex === toolIndex
                                      }
                                      onToggle={() => {
                                        if (
                                          expandedStudyTool?.courseIndex === courseIndex &&
                                          expandedStudyTool?.toolIndex === toolIndex
                                        ) {
                                          setExpandedStudyTool(null)
                                        } else {
                                          setExpandedStudyTool({ courseIndex, toolIndex })
                                        }
                                      }}
                                      onRemove={() => removeStudyTool(courseIndex, toolIndex)}
                                      onUpdate={(field: string, value: any) => 
                                        updateStudyTool(courseIndex, toolIndex, field as keyof StudyToolData, value)
                                      }
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="sticky bottom-4 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/create/bulk')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <div className="flex items-center gap-3">
                {formData.courses.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>
                      {formData.courses.length} course{formData.courses.length !== 1 ? 's' : ''} ready
                    </span>
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={isCreating || !canSubmit || !formData.semester.title || !formData.semester.section || formData.courses.length === 0}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Semester
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
