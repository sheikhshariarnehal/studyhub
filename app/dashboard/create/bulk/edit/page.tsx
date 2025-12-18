"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
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
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  GraduationCap,
  ExternalLink,
  Link as LinkIcon
} from "lucide-react"

// Interfaces (same as create page)
interface SemesterData {
  id?: string
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
      case 'previous_questions': 
        return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'exam_note': 
        return <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'syllabus': 
        return <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      case 'mark_distribution': 
        return <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      default: 
        return <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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

  const getToolColor = (type: string) => {
    switch(type) {
      case 'previous_questions': return 'blue'
      case 'exam_note': return 'green'
      case 'syllabus': return 'purple'
      case 'mark_distribution': return 'orange'
      default: return 'gray'
    }
  }

  const color = getToolColor(tool.type)
  const isSyllabus = tool.type === 'syllabus'

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`group border-l-4 ${
        isDragging 
          ? 'border-l-blue-500 shadow-2xl scale-[1.02]' 
          : `border-l-${color}-400 dark:border-l-${color}-600 hover:shadow-md`
      } transition-all duration-200`}
    >
      <CardHeader className="pb-3 pt-3">
        <div className="flex items-center gap-2">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-accent rounded transition-colors flex-shrink-0 group-hover:bg-accent/50"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div 
            className="flex-1 flex items-center gap-3 cursor-pointer hover:bg-accent/30 -mx-1 px-1 py-1.5 rounded transition-colors min-w-0"
            onClick={onToggle}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className={`p-1.5 rounded-lg bg-${color}-100 dark:bg-${color}-950/30 flex-shrink-0`}>
                {getToolIcon(tool.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate mb-0.5">
                  {tool.title || <span className="text-muted-foreground italic">Untitled Tool</span>}
                </div>
                
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-0 h-5 border-${color}-300 dark:border-${color}-700 text-${color}-700 dark:text-${color}-300`}
                >
                  {getToolTypeLabel(tool.type)}
                </Badge>
              </div>
              
              {!isSyllabus && tool.content_url && (
                <a 
                  href={tool.content_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
                  title="Open link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }} 
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          <Separator />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`space-y-2 ${isSyllabus ? 'sm:col-span-2' : ''}`}>
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Title 
                <span className="text-red-500 text-xs">*</span>
              </Label>
              <Input 
                placeholder="e.g., Course Syllabus - Fall 2024" 
                value={tool.title} 
                onChange={(e) => onUpdate("title", e.target.value)} 
                className="h-10 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                Type
                <span className="text-red-500 text-xs">*</span>
              </Label>
              <Select value={tool.type} onValueChange={(value) => onUpdate("type", value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_questions">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>Previous Questions</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="exam_note">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span>Exam Notes</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="syllabus">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                      <span>Syllabus</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mark_distribution">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      <span>Mark Distribution</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isSyllabus && (
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Content URL 
                  <span className="text-red-500 text-xs">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://drive.google.com/..." 
                    value={tool.content_url} 
                    onChange={(e) => onUpdate("content_url", e.target.value)} 
                    className="h-10 flex-1 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 font-mono text-xs" 
                  />
                  {tool.content_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-3"
                      asChild
                    >
                      <a href={tool.content_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Description 
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea 
              placeholder={isSyllabus ? "Add syllabus content here..." : "Add additional details about this study tool..."} 
              value={tool.description} 
              onChange={(e) => onUpdate("description", e.target.value)} 
              rows={isSyllabus ? 4 : 2} 
              className="resize-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20" 
            />
            {isSyllabus && (
              <p className="text-xs text-muted-foreground">
                For syllabus, add the content directly in the description field
              </p>
            )}
          </div>

          {/* Validation indicator */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <div className="flex-1">
              {tool.title && (isSyllabus || tool.content_url) ? (
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">Ready to save</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {!tool.title && "Title required"}
                    {tool.title && !isSyllabus && !tool.content_url && "Content URL required"}
                  </span>
                </div>
              )}
            </div>
            {!isSyllabus && tool.content_url && (
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <a href={tool.content_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Test Link
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Sortable Topic Component (same as create page)
function SortableTopic({ topic, topicIndex, courseIndex, isExpanded, onToggle, onRemove, onUpdate, onAddSlide, onRemoveSlide, onUpdateSlide, onAddVideo, onRemoveVideo, onUpdateVideo }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `topic-${courseIndex}-${topicIndex}` 
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className={`border-l-4 ${isDragging ? 'border-l-purple-500 shadow-xl' : 'border-l-purple-300'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-accent rounded-md transition-colors">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div 
            className="flex-1 flex items-center justify-between cursor-pointer hover:bg-accent/50 -m-2 p-2 rounded-md transition-colors"
            onClick={onToggle}
          >
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-semibold">Topic {topicIndex + 1}</Badge>
              <span className="font-semibold text-base">{topic.title || "Untitled Topic"}</span>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><PresentationIcon className="h-3 w-3" />{topic.slides.length}</span>
                <span className="flex items-center gap-1"><Video className="h-3 w-3" />{topic.videos.length}</span>
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
              <Label className="text-sm font-semibold flex items-center gap-2">Topic Title <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g., Introduction to Machine Learning" value={topic.title} onChange={(e) => onUpdate("title", e.target.value)} className="h-10 dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Order Index</Label>
              <Input type="number" min="0" value={topic.order_index || 0} onChange={(e) => onUpdate("order_index", parseInt(e.target.value) || 0)} className="h-10 dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description</Label>
            <Textarea placeholder="Describe what students will learn..." value={topic.description} onChange={(e) => onUpdate("description", e.target.value)} rows={3} className="resize-none dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600" />
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2"><PresentationIcon className="h-4 w-4 text-blue-600" />Slides ({topic.slides.length})</h4>
              <Button onClick={onAddSlide} size="sm" variant="outline" className="h-8"><Plus className="h-3 w-3 mr-1" />Add Slide</Button>
            </div>
            {topic.slides.map((slide: any, slideIndex: number) => (
              <div key={slideIndex} className="grid gap-3 p-4 border rounded-lg bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Slide title" value={slide.title} onChange={(e) => onUpdateSlide(slideIndex, "title", e.target.value)} className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600" />
                  <Input placeholder="Google Drive/Docs URL" value={slide.url} onChange={(e) => onUpdateSlide(slideIndex, "url", e.target.value)} className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600" />
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Description (optional)" value={slide.description || ""} onChange={(e) => onUpdateSlide(slideIndex, "description", e.target.value)} className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600 flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => onRemoveSlide(slideIndex)} className="h-9 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Video className="h-4 w-4 text-purple-600" />Videos ({topic.videos.length})</h4>
              <Button onClick={onAddVideo} size="sm" variant="outline" className="h-8"><Plus className="h-3 w-3 mr-1" />Add Video</Button>
            </div>
            {topic.videos.map((video: any, videoIndex: number) => (
              <div key={videoIndex} className="grid gap-3 p-4 border rounded-lg bg-purple-50/30 dark:bg-purple-950/20 dark:border-purple-800">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Video title" value={video.title} onChange={(e) => onUpdateVideo(videoIndex, "title", e.target.value)} className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600" />
                  <Input placeholder="YouTube/Video URL" value={video.url} onChange={(e) => onUpdateVideo(videoIndex, "url", e.target.value)} className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600" />
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Description (optional)" value={video.description || ""} onChange={(e) => onUpdateVideo(videoIndex, "description", e.target.value)} className="h-9 bg-white dark:bg-gray-900 dark:border-gray-700 dark:focus:border-blue-600 flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => onRemoveVideo(videoIndex)} className="h-9 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function EditPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const semesterId = searchParams.get('id')

  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<{ courseIndex: number; topicIndex: number } | null>(null)
  const [expandedStudyTool, setExpandedStudyTool] = useState<{ courseIndex: number; toolIndex: number } | null>(null)
  const [formData, setFormData] = useState<AllInOneData>({
    semester: { title: "", description: "", section: "", has_midterm: true, has_final: true, is_active: true },
    courses: []
  })

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  useEffect(() => {
    if (semesterId) {
      loadSemesterData()
    } else {
      router.push('/dashboard/create/bulk')
    }
  }, [semesterId])

  const loadSemesterData = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Loading semester data for ID:', semesterId)
      const response = await fetch(`/api/admin/all-in-one/${semesterId}`)
      if (!response.ok) throw new Error('Failed to load semester data')
      
      const data = await response.json()
      console.log('✅ Semester data loaded:', data)
      console.log('📊 Courses count:', data.courses?.length || 0)
      
      if (data.courses && data.courses.length > 0) {
        console.log('📚 First course:', data.courses[0].title)
        console.log('📝 Topics in first course:', data.courses[0].topics?.length || 0)
        if (data.courses[0].topics && data.courses[0].topics.length > 0) {
          console.log('🎯 First topic:', data.courses[0].topics[0])
        }
      }
      
      if (data.semester && data.semester.is_active === undefined) {
        data.semester.is_active = true
      }
      
      // Ensure all courses have topics and studyTools arrays
      if (data.courses) {
        data.courses = data.courses.map((course: any) => ({
          ...course,
          topics: course.topics || [],
          studyTools: course.studyTools || []
        }))
      }
      
      setFormData(data)
      
      // Auto-expand first course for better UX
      if (data.courses && data.courses.length > 0) {
        setExpandedCourse(0)
      }
      
      const totalTopics = data.courses?.reduce((sum: number, c: any) => sum + (c.topics?.length || 0), 0) || 0
      toast.success(`Semester loaded: ${data.courses?.length || 0} courses, ${totalTopics} topics`)
    } catch (error) {
      console.error('❌ Error loading semester:', error)
      toast.error('Failed to load semester data')
      router.push('/dashboard/create/bulk')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent, courseIndex: number) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIndex = parseInt(active.id.toString().split('-')[2])
    const overIndex = parseInt(over.id.toString().split('-')[2])

    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex ? { ...course, topics: arrayMove(course.topics, activeIndex, overIndex) } : course
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

  // All the same management functions as create page
  const addCourse = () => {
    setFormData(prev => ({ ...prev, courses: [...prev.courses, { title: "", course_code: "", teacher_name: "", teacher_email: "", credits: 3, description: "", is_highlighted: false, topics: [], studyTools: [] }] }))
    setExpandedCourse(formData.courses.length)
  }

  const removeCourse = (index: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.filter((_, i) => i !== index) }))
    if (expandedCourse === index) setExpandedCourse(null)
    toast.success("Course removed")
  }

  const updateCourse = (index: number, field: keyof CourseData, value: any) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === index ? { ...course, [field]: value } : course) }))
  }

  const addTopic = (courseIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex ? { ...course, topics: [...course.topics, { title: "", description: "", order_index: course.topics.length, slides: [], videos: [] }] } : course
      )
    }))
    setExpandedTopic({ courseIndex, topicIndex: formData.courses[courseIndex].topics.length })
  }

  const removeTopic = (courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.filter((_, j) => j !== topicIndex) } : course) }))
    toast.success("Topic removed")
  }

  const updateTopic = (courseIndex: number, topicIndex: number, field: keyof TopicData, value: any) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, [field]: value } : topic) } : course) }))
  }

  const addSlide = (courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, slides: [...topic.slides, { title: "", url: "", description: "" }] } : topic) } : course) }))
  }

  const removeSlide = (courseIndex: number, topicIndex: number, slideIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, slides: topic.slides.filter((_, k) => k !== slideIndex) } : topic) } : course) }))
  }

  const updateSlide = (courseIndex: number, topicIndex: number, slideIndex: number, field: string, value: string) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, slides: topic.slides.map((slide, k) => k === slideIndex ? { ...slide, [field]: value } : slide) } : topic) } : course) }))
  }

  const addVideo = (courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, videos: [...topic.videos, { title: "", url: "", description: "" }] } : topic) } : course) }))
  }

  const removeVideo = (courseIndex: number, topicIndex: number, videoIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, videos: topic.videos.filter((_, k) => k !== videoIndex) } : topic) } : course) }))
  }

  const updateVideo = (courseIndex: number, topicIndex: number, videoIndex: number, field: string, value: string) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, videos: topic.videos.map((video, k) => k === videoIndex ? { ...video, [field]: value } : video) } : topic) } : course) }))
  }

  const addStudyTool = (courseIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, studyTools: [...course.studyTools, { title: "", type: "previous_questions", content_url: "", exam_type: "both", description: "" }] } : course) }))
  }

  const removeStudyTool = (courseIndex: number, toolIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, studyTools: course.studyTools.filter((_, j) => j !== toolIndex) } : course) }))
  }

  const updateStudyTool = (courseIndex: number, toolIndex: number, field: keyof StudyToolData, value: any) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, studyTools: course.studyTools.map((tool, j) => j === toolIndex ? { ...tool, [field]: value } : tool) } : course) }))
  }

  const validateForm = (): boolean => {
    if (!formData.semester.title.trim()) { toast.error("Semester title is required"); return false }
    if (!formData.semester.section.trim()) { toast.error("Section is required"); return false }
    if (formData.courses.length === 0) { toast.error("At least one course is required"); return false }
    
    for (let i = 0; i < formData.courses.length; i++) {
      const course = formData.courses[i]
      if (!course.title.trim()) { toast.error(`Course ${i + 1}: Title is required`); return false }
      if (!course.course_code.trim()) { toast.error(`Course ${i + 1}: Course code is required`); return false }
      if (!course.teacher_name.trim()) { toast.error(`Course ${i + 1}: Teacher name is required`); return false }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/all-in-one/${semesterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update semester')
      }

      toast.success("✅ Semester updated successfully!")
      router.push('/dashboard/create/bulk')
    } catch (error: any) {
      console.error('Error updating semester:', error)
      toast.error(error.message || 'Failed to update semester')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading semester data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-1">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/create/bulk')} className="h-8 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Semester
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:ml-20">Update semester details, courses, and materials</p>
        </div>
        <Button onClick={loadSemesterData} variant="outline" size="default" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />Reload
        </Button>
      </div>

      {/* Rest of the form - same structure as create page */}
      <div className="space-y-6">
        <Card className="border-t-4 border-t-blue-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-600" />Semester Information</CardTitle>
            <CardDescription>Update semester details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">Semester Title <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g., Fall 2024" value={formData.semester.title} onChange={(e) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, title: e.target.value } }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">Section <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g., A, B, C" value={formData.semester.section} onChange={(e) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, section: e.target.value } }))} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea placeholder="Describe the semester..." value={formData.semester.description} onChange={(e) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, description: e.target.value } }))} rows={3} className="resize-none" />
            </div>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Start Date</Label>
                <Input type="date" value={formData.semester.start_date} onChange={(e) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, start_date: e.target.value } }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">End Date</Label>
                <Input type="date" value={formData.semester.end_date} onChange={(e) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, end_date: e.target.value } }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Default Credits</Label>
                <Input type="number" min="1" max="6" value={formData.semester.default_credits} onChange={(e) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, default_credits: parseInt(e.target.value) || 3 } }))} className="h-11" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4">
              <div className="flex items-center gap-3">
                <Switch checked={formData.semester.has_midterm} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, has_midterm: checked } }))} />
                <Label className="text-sm font-medium cursor-pointer">Has Midterm Exam</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.semester.has_final} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, has_final: checked } }))} />
                <Label className="text-sm font-medium cursor-pointer">Has Final Exam</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.semester.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, semester: { ...prev.semester, is_active: checked } }))} />
                <Label className="text-sm font-medium cursor-pointer">Set as Active</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses section */}
        <Card className="border-t-4 border-t-purple-500 shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-600" />Courses ({formData.courses.length})</CardTitle>
                <CardDescription>Manage courses with topics and materials</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {formData.courses.length > 1 && (
                  <Button 
                    onClick={() => {
                      if (expandedCourse !== null) {
                        setExpandedCourse(null)
                      } else {
                        setExpandedCourse(0)
                      }
                    }} 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    {expandedCourse !== null ? 'Collapse All' : 'Expand First'}
                  </Button>
                )}
                <Button onClick={addCourse} className="bg-gradient-to-r from-purple-600 to-blue-600 flex-1 sm:flex-none"><Plus className="h-4 w-4 mr-2" />Add Course</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {formData.courses.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground mb-4">No courses added yet</p>
                <Button onClick={addCourse} variant="outline"><Plus className="h-4 w-4 mr-2" />Add Your First Course</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Course cards - same structure as create page */}
                {formData.courses.map((course, courseIndex) => (
                  <Card key={courseIndex} className="border-l-4 border-l-purple-400 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-accent/50 -m-2 p-2 rounded-md transition-colors"
                          onClick={() => {
                            console.log('🔽 Toggling course', courseIndex, 'Current expanded:', expandedCourse)
                            setExpandedCourse(expandedCourse === courseIndex ? null : courseIndex)
                          }}
                        >
                          <Badge className="bg-purple-600">Course {courseIndex + 1}</Badge>
                          <span className="font-semibold text-lg">{course.title || "Untitled Course"}</span>
                          {course.course_code && <Badge variant="outline" className="font-mono">{course.course_code}</Badge>}
                          {course.is_highlighted && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                          <div className="ml-auto flex gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{course.topics?.length || 0} topics</span>
                            <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{course.studyTools?.length || 0} tools</span>
                          </div>
                          <div className="flex items-center">
                            {expandedCourse === courseIndex ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              removeCourse(courseIndex)
                            }} 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {expandedCourse === courseIndex && (
                      <CardContent className="space-y-6 pt-0">
                        <Separator />
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">Title <span className="text-red-500">*</span></Label>
                            <Input placeholder="e.g., Data Structures" value={course.title} onChange={(e) => updateCourse(courseIndex, "title", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">Course Code <span className="text-red-500">*</span></Label>
                            <Input placeholder="e.g., CSE201" value={course.course_code} onChange={(e) => updateCourse(courseIndex, "course_code", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">Teacher Name <span className="text-red-500">*</span></Label>
                            <Input placeholder="e.g., Dr. John Doe" value={course.teacher_name} onChange={(e) => updateCourse(courseIndex, "teacher_name", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Teacher Email</Label>
                            <Input placeholder="teacher@example.com" type="email" value={course.teacher_email} onChange={(e) => updateCourse(courseIndex, "teacher_email", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Credits</Label>
                            <Input type="number" min="1" max="6" value={course.credits} onChange={(e) => updateCourse(courseIndex, "credits", parseInt(e.target.value) || 3)} />
                          </div>
                          <div className="space-y-2 flex items-end">
                            <div className="flex items-center gap-3">
                              <Switch checked={course.is_highlighted} onCheckedChange={(checked) => updateCourse(courseIndex, "is_highlighted", checked)} />
                              <Label className="flex items-center gap-2 cursor-pointer"><Star className="h-4 w-4" />Highlight Course</Label>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea placeholder="Course description..." value={course.description} onChange={(e) => updateCourse(courseIndex, "description", e.target.value)} rows={2} />
                        </div>

                        <Separator />

                        {/* Topics Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-600" />
                              Topics ({course.topics?.length || 0})
                            </h4>
                            <Button onClick={() => addTopic(courseIndex)} size="sm" variant="outline">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Topic
                            </Button>
                          </div>

                          {course.topics && course.topics.length > 0 && (
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
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                                <ClipboardList className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-base flex items-center gap-2">
                                  Study Tools
                                  <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                                    {course.studyTools?.length || 0}
                                  </Badge>
                                </h4>
                                <p className="text-xs text-muted-foreground">Exam materials and resources</p>
                              </div>
                            </div>
                            <Button 
                              onClick={() => addStudyTool(courseIndex)} 
                              size="sm" 
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm h-9"
                            >
                              <Plus className="h-4 w-4 mr-1.5" />
                              Add Tool
                            </Button>
                          </div>

                          {course.studyTools && course.studyTools.length === 0 ? (
                            <div className="relative overflow-hidden text-center py-12 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl bg-gradient-to-br from-blue-50/50 via-blue-50/30 to-transparent dark:from-blue-950/30 dark:via-blue-950/20 dark:to-transparent">
                              <div className="absolute inset-0 bg-grid-blue-500/[0.03] dark:bg-grid-blue-400/[0.05]" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                              }} />
                              <div className="relative">
                                <div className="mb-4 flex justify-center">
                                  <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-900/40">
                                    <ClipboardList className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                                  </div>
                                </div>
                                <h5 className="font-semibold text-base mb-2">No Study Tools Yet</h5>
                                <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                                  Add exam notes, previous questions, syllabus, or mark distributions to help students prepare
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                                  <Button 
                                    onClick={() => addStudyTool(courseIndex)} 
                                    size="sm" 
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                                  >
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Add Your First Tool
                                  </Button>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="hidden sm:inline">or press</span>
                                    <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                                      Add Tool
                                    </kbd>
                                    <span className="hidden sm:inline">above</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event: DragEndEvent) => handleStudyToolDragEnd(event, courseIndex)}
                            >
                              <SortableContext
                                items={course.studyTools?.map((_, idx) => `studytool-${courseIndex}-${idx}`) || []}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {course.studyTools?.map((tool, toolIndex) => (
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

        <Card className="shadow-lg border-t-4 border-t-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="lg" onClick={() => router.push('/dashboard/create/bulk')}><ArrowLeft className="h-4 w-4 mr-2" />Cancel</Button>
              <div className="flex gap-3">
                {formData.courses.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-blue-50 rounded-md">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>{formData.courses.length} course{formData.courses.length !== 1 ? 's' : ''} ready</span>
                  </div>
                )}
                <Button size="lg" onClick={handleSubmit} disabled={isUpdating || !formData.semester.title || !formData.semester.section || formData.courses.length === 0} className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 shadow-lg px-8">
                  {isUpdating ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />Updating...</>) : (<><Save className="h-5 w-5 mr-2" />Update Semester</>)}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function EditBulkCreatorPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    }>
      <EditPageContent />
    </Suspense>
  )
}
