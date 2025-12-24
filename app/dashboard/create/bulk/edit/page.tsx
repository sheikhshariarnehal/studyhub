"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Link as LinkIcon,
  Calendar,
  Users,
  Layers,
  Pencil
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

// Sortable Topic Component with Modern Styling
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
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "border-0 overflow-hidden transition-all duration-200",
        isDragging 
          ? "shadow-xl ring-2 ring-purple-500 scale-[1.02]" 
          : "bg-white/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md"
      )}
    >
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors flex-shrink-0"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div 
            className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/30 -mx-1 px-2 py-1.5 rounded-lg transition-colors"
            onClick={onToggle}
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge className="bg-purple-600 text-white rounded-md px-2.5 py-0.5 text-xs font-semibold">
                {topicIndex + 1}
              </Badge>
              <span className="font-semibold text-sm sm:text-base">
                {topic.title || <span className="text-muted-foreground italic">Untitled Topic</span>}
              </span>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                  <PresentationIcon className="h-3 w-3" />
                  {topic.slides.length}
                </span>
                <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md">
                  <Video className="h-3 w-3" />
                  {topic.videos.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className={cn(
                "p-1.5 rounded-md transition-colors",
                isExpanded ? "bg-purple-100 dark:bg-purple-900/30" : "bg-slate-100 dark:bg-slate-800"
              )}>
                {isExpanded 
                  ? <ChevronUp className="h-4 w-4 text-purple-600 dark:text-purple-400" /> 
                  : <ChevronDown className="h-4 w-4" />
                }
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }} 
                className="h-8 w-8 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-5 px-4 pb-5">
          <Separator className="bg-slate-200 dark:bg-slate-700" />
          
          {/* Topic Details */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Topic Title <span className="text-red-500">*</span>
                </Label>
                <Input 
                  placeholder="e.g., Introduction to Machine Learning" 
                  value={topic.title} 
                  onChange={(e) => onUpdate("title", e.target.value)} 
                  className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Order Index</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={topic.order_index || 0} 
                  onChange={(e) => onUpdate("order_index", parseInt(e.target.value) || 0)} 
                  className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea 
                placeholder="Describe what students will learn..." 
                value={topic.description} 
                onChange={(e) => onUpdate("description", e.target.value)} 
                rows={2} 
                className="resize-none rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
              />
            </div>
          </div>

          {/* Slides Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <PresentationIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                Slides
                <Badge variant="secondary" className="text-xs">{topic.slides.length}</Badge>
              </h4>
              <Button 
                onClick={onAddSlide} 
                size="sm" 
                className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Slide
              </Button>
            </div>
            
            {topic.slides.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-blue-200 dark:border-blue-800/50 rounded-xl bg-blue-50/30 dark:bg-blue-950/20">
                <PresentationIcon className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No slides added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topic.slides.map((slide: any, slideIndex: number) => (
                  <div key={slideIndex} className="grid gap-3 p-4 border border-blue-200 dark:border-blue-800/50 rounded-xl bg-blue-50/30 dark:bg-blue-950/20 group">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input 
                        placeholder="Slide title" 
                        value={slide.title} 
                        onChange={(e) => onUpdateSlide(slideIndex, "title", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-800" 
                      />
                      <Input 
                        placeholder="Google Drive/Docs URL" 
                        value={slide.url} 
                        onChange={(e) => onUpdateSlide(slideIndex, "url", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Description (optional)" 
                        value={slide.description || ""} 
                        onChange={(e) => onUpdateSlide(slideIndex, "description", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-800 flex-1" 
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onRemoveSlide(slideIndex)} 
                        className="h-9 w-9 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/30 opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                  <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                Videos
                <Badge variant="secondary" className="text-xs">{topic.videos.length}</Badge>
              </h4>
              <Button 
                onClick={onAddVideo} 
                size="sm" 
                className="h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Video
              </Button>
            </div>
            
            {topic.videos.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-purple-200 dark:border-purple-800/50 rounded-xl bg-purple-50/30 dark:bg-purple-950/20">
                <Video className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No videos added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topic.videos.map((video: any, videoIndex: number) => (
                  <div key={videoIndex} className="grid gap-3 p-4 border border-purple-200 dark:border-purple-800/50 rounded-xl bg-purple-50/30 dark:bg-purple-950/20 group">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input 
                        placeholder="Video title" 
                        value={video.title} 
                        onChange={(e) => onUpdateVideo(videoIndex, "title", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-800" 
                      />
                      <Input 
                        placeholder="YouTube/Video URL" 
                        value={video.url} 
                        onChange={(e) => onUpdateVideo(videoIndex, "url", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Description (optional)" 
                        value={video.description || ""} 
                        onChange={(e) => onUpdateVideo(videoIndex, "description", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-800 flex-1" 
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onRemoveVideo(videoIndex)} 
                        className="h-9 w-9 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/30 opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading semester data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                asChild
                className="h-10 w-10 rounded-lg"
              >
                <Link href="/dashboard/create/bulk">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Edit Semester
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Update semester details, courses & materials
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={loadSemesterData}
                variant="outline"
                size="sm"
                className="h-9"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Semester Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Semester Information</CardTitle>
                    <CardDescription>Update semester details</CardDescription>
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
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Start Date
                    </Label>
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
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      End Date
                    </Label>
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
                    <Label className="text-sm cursor-pointer">Has Midterm</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.semester.has_final}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        semester: { ...prev.semester, has_final: checked }
                      }))}
                    />
                    <Label className="text-sm cursor-pointer">Has Final</Label>
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
                      <CardDescription>Manage courses with topics and materials</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                      >
                        {expandedCourse !== null ? 'Collapse All' : 'Expand First'}
                      </Button>
                    )}
                    <Button 
                      onClick={addCourse} 
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Course
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
            {formData.courses.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-muted-foreground mb-4">No courses added yet</p>
                <Button 
                  onClick={addCourse} 
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Course
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.courses.map((course, courseIndex) => (
                  <Card key={courseIndex} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div 
                        className="flex items-center justify-between gap-3 cursor-pointer"
                        onClick={() => {
                          console.log('🔽 Toggling course', courseIndex, 'Current expanded:', expandedCourse)
                          setExpandedCourse(expandedCourse === courseIndex ? null : courseIndex)
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                          <Badge variant="secondary" className="shrink-0">
                            Course {courseIndex + 1}
                          </Badge>
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
                              <Layers className="h-3 w-3" />
                              {course.topics?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClipboardList className="h-3 w-3" />
                              {course.studyTools?.length || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {expandedCourse === courseIndex 
                            ? <ChevronUp className="h-4 w-4" /> 
                            : <ChevronDown className="h-4 w-4" />
                          }
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
                      <CardContent className="space-y-6 pt-0 pb-6">
                        <Separator className="bg-slate-200 dark:bg-slate-800" />
                        
                        {/* Course Basic Info */}
                        <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 sm:p-5 space-y-4">
                          <h5 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Course Details
                          </h5>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-sm">
                                Title <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="e.g., Data Structures"
                                value={course.title}
                                onChange={(e) => updateCourse(courseIndex, "title", e.target.value)}
                                className="h-10 rounded-lg bg-slate-50/50 dark:bg-slate-900/50"
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
                                className="h-10 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 font-mono"
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
                                className="h-10 rounded-lg bg-slate-50/50 dark:bg-slate-900/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Teacher Email</Label>
                              <Input
                                placeholder="teacher@example.com"
                                type="email"
                                value={course.teacher_email}
                                onChange={(e) => updateCourse(courseIndex, "teacher_email", e.target.value)}
                                className="h-10 rounded-lg bg-slate-50/50 dark:bg-slate-900/50"
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
                                className="h-10 rounded-lg bg-slate-50/50 dark:bg-slate-900/50"
                              />
                            </div>
                            <div className="space-y-2 flex items-end">
                              <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg">
                                <Switch
                                  checked={course.is_highlighted}
                                  onCheckedChange={(checked) => updateCourse(courseIndex, "is_highlighted", checked)}
                                />
                                <Label className="flex items-center gap-2 cursor-pointer text-sm">
                                  <Star className="h-4 w-4 text-yellow-500" />
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
                              className="resize-none rounded-lg bg-slate-50/50 dark:bg-slate-900/50"
                            />
                          </div>
                        </div>

                        {/* Topics Section */}
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                                <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              Topics
                              <Badge variant="secondary" className="ml-1">{course.topics?.length || 0}</Badge>
                            </h4>
                            <Button
                              onClick={() => addTopic(courseIndex)}
                              size="sm"
                              className="h-9 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
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
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                                <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              Study Tools
                              <Badge variant="secondary" className="ml-1">{course.studyTools?.length || 0}</Badge>
                            </h4>
                            <Button
                              onClick={() => addStudyTool(courseIndex)}
                              size="sm"
                              className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Add Tool
                            </Button>
                          </div>

                          {course.studyTools && course.studyTools.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-blue-200 dark:border-blue-800/50 rounded-xl bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <ClipboardList className="h-6 w-6 text-blue-400" />
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">No study tools added</p>
                              <Button 
                                onClick={() => addStudyTool(courseIndex)} 
                                size="sm" 
                                className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
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
                  disabled={isUpdating || !formData.semester.title || !formData.semester.section || formData.courses.length === 0}
                  className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Semester
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
    </TooltipProvider>
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
