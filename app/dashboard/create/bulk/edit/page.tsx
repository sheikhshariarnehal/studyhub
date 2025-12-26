"use client"

import { useState, useEffect, useCallback, Suspense, useMemo, memo, useRef, useTransition, startTransition } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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
  Pencil,
  Sparkles,
  Eye,
  Copy,
  Check,
  Info,
  Keyboard,
  Undo2,
  Search,
  Filter,
  SortAsc,
  Clock,
  AlertTriangle,
  Download,
  Upload
} from "lucide-react"

// ============================================================================
// UTILITIES
// ============================================================================

// Debounce hook for input optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// Batch state updates utility
const batchUpdate = (fn: () => void) => {
  startTransition(() => fn())
}

// Generate semester title based on selected semester and current date
const generateSemesterTitle = (semesterType: SemesterType): string => {
  if (!semesterType) return ""
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  return `${semesterType} ${currentYear}`
}

// Extract semester type from title (e.g., "Fall 2025" -> "Fall")
const extractSemesterType = (title: string): SemesterType => {
  if (title.startsWith('Fall')) return 'Fall'
  if (title.startsWith('Summer')) return 'Summer'
  if (title.startsWith('Spring')) return 'Spring'
  return null
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type SemesterType = 'Fall' | 'Summer' | 'Spring' | null

interface UserContext {
  id: string
  role: string
  full_name: string
  department_id: string | null
  batch_id: string | null
  section_id: string | null
  department?: { id: string; name: string; short_name: string } | null
  batch?: { id: string; batch_name: string; batch_number: number } | null
  section?: { id: string; name: string } | null
  is_approved: boolean
}

interface SemesterData {
  id?: string
  selectedSemester?: SemesterType
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

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

// Progress Stats Card - Memoized for performance
const ProgressStats = memo(function ProgressStats({ 
  formData, 
  className 
}: { 
  formData: AllInOneData
  className?: string 
}) {
  const stats = useMemo(() => {
    const totalCourses = formData.courses.length
    const totalTopics = formData.courses.reduce((sum, c) => sum + (c.topics?.length || 0), 0)
    const totalSlides = formData.courses.reduce((sum, c) => 
      c.topics?.reduce((ts, t) => ts + (t.slides?.length || 0), 0) || 0, 0)
    const totalVideos = formData.courses.reduce((sum, c) => 
      c.topics?.reduce((tv, t) => tv + (t.videos?.length || 0), 0) || 0, 0)
    const totalStudyTools = formData.courses.reduce((sum, c) => sum + (c.studyTools?.length || 0), 0)
    
    // Calculate completion percentage
    const semesterComplete = formData.semester.title && formData.semester.section ? 1 : 0
    const coursesComplete = totalCourses > 0 ? 1 : 0
    const completion = Math.round(((semesterComplete + coursesComplete) / 2) * 100)
    
    return { totalCourses, totalTopics, totalSlides, totalVideos, totalStudyTools, completion }
  }, [formData])

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3", className)}>
      <StatCard 
        icon={BookOpen} 
        label="Courses" 
        value={stats.totalCourses} 
        color="purple"
      />
      <StatCard 
        icon={Layers} 
        label="Topics" 
        value={stats.totalTopics} 
        color="blue"
      />
      <StatCard 
        icon={PresentationIcon} 
        label="Slides" 
        value={stats.totalSlides} 
        color="cyan"
      />
      <StatCard 
        icon={Video} 
        label="Videos" 
        value={stats.totalVideos} 
        color="pink"
      />
      <StatCard 
        icon={ClipboardList} 
        label="Study Tools" 
        value={stats.totalStudyTools} 
        color="amber"
      />
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-800/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Ready</span>
        </div>
        <Progress value={stats.completion} className="h-1.5" />
        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completion}%</p>
      </div>
    </div>
  )
})

// Stat Card Component
const StatCard = memo(function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType
  label: string
  value: number
  color: 'purple' | 'blue' | 'cyan' | 'pink' | 'amber' | 'emerald'
}) {
  const colorClasses = {
    purple: 'from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border-purple-200 dark:border-purple-800/50',
    blue: 'from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800/50',
    cyan: 'from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50 border-cyan-200 dark:border-cyan-800/50',
    pink: 'from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50 border-pink-200 dark:border-pink-800/50',
    amber: 'from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800/50',
    emerald: 'from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-emerald-200 dark:border-emerald-800/50',
  }
  
  const iconColorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400',
    pink: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
  }
  
  const textColorClasses = {
    purple: 'text-purple-700 dark:text-purple-300',
    blue: 'text-blue-700 dark:text-blue-300',
    cyan: 'text-cyan-700 dark:text-cyan-300',
    pink: 'text-pink-700 dark:text-pink-300',
    amber: 'text-amber-700 dark:text-amber-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
  }
  
  const valueColorClasses = {
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    pink: 'text-pink-600 dark:text-pink-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
  }

  return (
    <div className={cn(
      "bg-gradient-to-br rounded-xl p-3 border transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
      colorClasses[color]
    )}>
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("p-1.5 rounded-lg", iconColorClasses[color])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className={cn("text-xs font-medium", textColorClasses[color])}>{label}</span>
      </div>
      <p className={cn("text-xl font-bold", valueColorClasses[color])}>{value}</p>
    </div>
  )
})

// Loading Skeleton for the page
const PageSkeleton = memo(function PageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800/60 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700/50">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        
        {/* Form Skeleton */}
        <Card className="border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-24" />
          </CardContent>
        </Card>
        
        {/* Courses Skeleton */}
        <Card className="border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

// ============================================================================
// STUDY TOOL CARD COMPONENT
// ============================================================================

// Study Tool Card Component with Drag-and-Drop - Memoized
const StudyToolCard = memo(function StudyToolCard({ tool, toolIndex, courseIndex, isExpanded, onToggle, onRemove, onUpdate }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `studytool-${courseIndex}-${toolIndex}` 
  })

  const style = useMemo(() => ({
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging])

  const getToolIcon = useCallback((type: string) => {
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
  }, [])

  const getToolTypeLabel = useCallback((type: string) => {
    switch(type) {
      case 'previous_questions': return 'Previous Questions'
      case 'exam_note': return 'Exam Notes'
      case 'syllabus': return 'Syllabus'
      case 'mark_distribution': return 'Mark Distribution'
      default: return 'Document'
    }
  }, [])

  const getToolColor = useCallback((type: string) => {
    switch(type) {
      case 'previous_questions': return 'blue'
      case 'exam_note': return 'green'
      case 'syllabus': return 'purple'
      case 'mark_distribution': return 'orange'
      default: return 'gray'
    }
  }, [])

  const color = getToolColor(tool.type)
  const isSyllabus = tool.type === 'syllabus'
  
  // Color mapping for Tailwind classes
  const colorStyles = useMemo(() => {
    const colorMap: Record<string, { border: string; borderDark: string; bg: string; bgDark: string; text: string; textDark: string }> = {
      blue: { border: 'border-l-blue-400', borderDark: 'dark:border-l-blue-600', bg: 'bg-blue-100', bgDark: 'dark:bg-blue-950/30', text: 'text-blue-700', textDark: 'dark:text-blue-300' },
      green: { border: 'border-l-green-400', borderDark: 'dark:border-l-green-600', bg: 'bg-green-100', bgDark: 'dark:bg-green-950/30', text: 'text-green-700', textDark: 'dark:text-green-300' },
      purple: { border: 'border-l-purple-400', borderDark: 'dark:border-l-purple-600', bg: 'bg-purple-100', bgDark: 'dark:bg-purple-950/30', text: 'text-purple-700', textDark: 'dark:text-purple-300' },
      orange: { border: 'border-l-orange-400', borderDark: 'dark:border-l-orange-600', bg: 'bg-orange-100', bgDark: 'dark:bg-orange-950/30', text: 'text-orange-700', textDark: 'dark:text-orange-300' },
      gray: { border: 'border-l-gray-400', borderDark: 'dark:border-l-gray-600', bg: 'bg-gray-100', bgDark: 'dark:bg-gray-950/30', text: 'text-gray-700', textDark: 'dark:text-gray-300' },
    }
    return colorMap[color] || colorMap.gray
  }, [color])

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group border-l-4 transition-all duration-200",
        isDragging 
          ? 'border-l-blue-500 shadow-2xl scale-[1.02] ring-2 ring-blue-500/20' 
          : `${colorStyles.border} ${colorStyles.borderDark} hover:shadow-md hover:translate-x-0.5`
      )}
    >
      <CardHeader className="pb-3 pt-3">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-accent rounded-lg transition-all duration-150 flex-shrink-0 group-hover:bg-accent/50"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Drag to reorder</p>
            </TooltipContent>
          </Tooltip>
          
          <div 
            className="flex-1 flex items-center gap-3 cursor-pointer hover:bg-accent/30 -mx-1 px-2 py-1.5 rounded-lg transition-all duration-150 min-w-0"
            onClick={onToggle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle() }}
            aria-expanded={isExpanded}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className={cn("p-1.5 rounded-lg flex-shrink-0 transition-colors", colorStyles.bg, colorStyles.bgDark)}>
                {getToolIcon(tool.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate mb-0.5">
                  {tool.title || <span className="text-muted-foreground italic">Untitled Tool</span>}
                </div>
                
                <Badge 
                  variant="outline" 
                  className={cn("text-xs px-2 py-0 h-5", colorStyles.text, colorStyles.textDark)}
                >
                  {getToolTypeLabel(tool.type)}
                </Badge>
              </div>
              
              {!isSyllabus && tool.content_url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a 
                      href={tool.content_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      aria-label="Open link in new tab"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Open in new tab</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <div className={cn(
                "p-1 rounded-md transition-colors duration-150",
                isExpanded ? "bg-blue-100 dark:bg-blue-900/30" : ""
              )}>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }} 
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150"
                aria-label="Remove study tool"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Remove tool</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-0 animate-in slide-in-from-top-2 duration-200">
          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className={`space-y-2 ${isSyllabus ? 'sm:col-span-2' : ''}`}>
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Title 
                <span className="text-red-500 text-xs">*</span>
              </Label>
              <Input 
                placeholder="e.g., Course Syllabus - Fall 2024" 
                value={tool.title} 
                onChange={(e) => onUpdate("title", e.target.value)} 
                className="h-10 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-shadow" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
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
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                <a href={tool.content_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                  Test Link
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
})

// ============================================================================
// SORTABLE TOPIC COMPONENT
// ============================================================================

// Sortable Topic Component with Modern Styling - Memoized
const SortableTopic = memo(function SortableTopic({ topic, topicIndex, courseIndex, isExpanded, onToggle, onRemove, onUpdate, onAddSlide, onRemoveSlide, onUpdateSlide, onAddVideo, onRemoveVideo, onUpdateVideo }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `topic-${courseIndex}-${topicIndex}` 
  })

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging])

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
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-150 flex-shrink-0"
                aria-label="Drag to reorder topic"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Drag to reorder</p>
            </TooltipContent>
          </Tooltip>
          
          <div 
            className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/30 -mx-1 px-2 py-1.5 rounded-lg transition-all duration-150"
            onClick={onToggle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle() }}
            aria-expanded={isExpanded}
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-md px-2.5 py-0.5 text-xs font-semibold shadow-sm">
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
                "p-1.5 rounded-md transition-all duration-150",
                isExpanded ? "bg-purple-100 dark:bg-purple-900/30" : "bg-slate-100 dark:bg-slate-800"
              )}>
                {isExpanded 
                  ? <ChevronUp className="h-4 w-4 text-purple-600 dark:text-purple-400" /> 
                  : <ChevronDown className="h-4 w-4" />
                }
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove()
                    }} 
                    className="h-8 w-8 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 transition-all duration-150"
                    aria-label="Remove topic"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Remove topic</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 px-3 pb-4 animate-in slide-in-from-top-2 duration-200">
          <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
          
          {/* Topic Details */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-3 space-y-3 border border-slate-200 dark:border-slate-700">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  Topic Title <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <Input 
                  placeholder="e.g., Introduction to Machine Learning" 
                  value={topic.title} 
                  onChange={(e) => onUpdate("title", e.target.value)} 
                  className="h-9 sm:h-10 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-purple-500/20" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Layers className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  Order Index
                </Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={topic.order_index || 0} 
                  onChange={(e) => onUpdate("order_index", parseInt(e.target.value) || 0)} 
                  className="h-9 sm:h-10 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-purple-500/20" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
              <Textarea 
                placeholder="Describe what students will learn..." 
                value={topic.description} 
                onChange={(e) => onUpdate("description", e.target.value)} 
                rows={2} 
                className="resize-none rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-purple-500/20" 
              />
            </div>
          </div>

          {/* Slides Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <PresentationIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Slides</span>
                <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300">{topic.slides.length}</Badge>
              </h4>
              <Button 
                onClick={onAddSlide} 
                size="sm" 
                className="h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-sm transition-all duration-150"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Slide
              </Button>
            </div>
            
            {topic.slides.length === 0 ? (
              <div className="text-center py-8 sm:py-10 border-2 border-dashed border-blue-200 dark:border-blue-800/50 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                <PresentationIcon className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 dark:text-blue-700 mx-auto mb-3" />
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">No slides added yet</p>
                <Button 
                  onClick={onAddSlide} 
                  variant="outline" 
                  size="sm"
                  className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Your First Slide
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {topic.slides.map((slide: any, slideIndex: number) => (
                  <div 
                    key={slideIndex} 
                    className="grid gap-2 p-3 border border-blue-200 dark:border-blue-800/50 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 group hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800/50 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-300">
                        Slide {slideIndex + 1}
                      </Badge>
                      {slide.url && (
                        <a 
                          href={slide.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input 
                        placeholder="Slide title" 
                        value={slide.title} 
                        onChange={(e) => onUpdateSlide(slideIndex, "title", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-blue-500/20" 
                      />
                      <Input 
                        placeholder="Google Drive/Docs URL" 
                        value={slide.url} 
                        onChange={(e) => onUpdateSlide(slideIndex, "url", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono text-xs transition-shadow focus:ring-2 focus:ring-blue-500/20" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Description (optional)" 
                        value={slide.description || ""} 
                        onChange={(e) => onUpdateSlide(slideIndex, "description", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 flex-1 transition-shadow focus:ring-2 focus:ring-blue-500/20" 
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onRemoveSlide(slideIndex)} 
                            className="h-9 w-9 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/30 opacity-60 group-hover:opacity-100 transition-all duration-150"
                            aria-label="Remove slide"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Remove slide</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Videos</span>
                <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300">{topic.videos.length}</Badge>
              </h4>
              <Button 
                onClick={onAddVideo} 
                size="sm" 
                className="h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm transition-all duration-150"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Video
              </Button>
            </div>
            
            {topic.videos.length === 0 ? (
              <div className="text-center py-8 sm:py-10 border-2 border-dashed border-purple-200 dark:border-purple-800/50 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 transition-colors hover:border-purple-300 dark:hover:border-purple-700">
                <Video className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400 dark:text-purple-700 mx-auto mb-3" />
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">No videos added yet</p>
                <Button 
                  onClick={onAddVideo} 
                  variant="outline" 
                  size="sm"
                  className="border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Your First Video
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {topic.videos.map((video: any, videoIndex: number) => (
                  <div 
                    key={videoIndex} 
                    className="grid gap-2 p-3 border border-purple-200 dark:border-purple-800/50 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 group hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800/50 border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-300">
                        Video {videoIndex + 1}
                      </Badge>
                      {video.url && (
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input 
                        placeholder="Video title" 
                        value={video.title} 
                        onChange={(e) => onUpdateVideo(videoIndex, "title", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-purple-500/20" 
                      />
                      <Input 
                        placeholder="YouTube/Video URL" 
                        value={video.url} 
                        onChange={(e) => onUpdateVideo(videoIndex, "url", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono text-xs transition-shadow focus:ring-2 focus:ring-purple-500/20" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Description (optional)" 
                        value={video.description || ""} 
                        onChange={(e) => onUpdateVideo(videoIndex, "description", e.target.value)} 
                        className="h-9 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 flex-1 transition-shadow focus:ring-2 focus:ring-purple-500/20" 
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onRemoveVideo(videoIndex)} 
                            className="h-9 w-9 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/30 opacity-60 group-hover:opacity-100 transition-all duration-150"
                            aria-label="Remove video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Remove video</p>
                        </TooltipContent>
                      </Tooltip>
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
})

// ============================================================================
// MAIN EDIT PAGE CONTENT COMPONENT
// ============================================================================

function EditPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const semesterId = searchParams.get('id')

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<{ courseIndex: number; topicIndex: number } | null>(null)
  const [expandedStudyTool, setExpandedStudyTool] = useState<{ courseIndex: number; toolIndex: number } | null>(null)
  const [formData, setFormData] = useState<AllInOneData>({
    semester: { title: "", description: "", section: "", has_midterm: true, has_final: true, is_active: true },
    courses: []
  })
  
  // Professional CMS features
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300) // Debounce search for performance
  const [filterType, setFilterType] = useState<"all" | "highlighted" | "normal">("all")
  const [isPending, startTransitionUpdate] = useTransition()
  
  // Refs for performance optimization
  const formDataRef = useRef(formData)
  formDataRef.current = formData
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'course' | 'topic' | 'tool', index: number, parentIndex?: number } | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // Check if user is a contributor
  const isContributor = userContext?.role === "contributor"
  const isAdmin = ["super_admin", "admin", "moderator", "content_creator", "section_admin"].includes(userContext?.role || "")

  // Memoized sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Track unsaved changes
  useEffect(() => {
    if (!isLoading) {
      setHasUnsavedChanges(true)
    }
  }, [formData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!isUpdating && formData.semester.title && formData.semester.section) {
          handleSubmit()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formData, isUpdating])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || isLoading || isUpdating) return
    
    const autoSaveTimer = setTimeout(async () => {
      if (formData.semester.title && formData.semester.section && formData.courses.length > 0) {
        setIsSaving(true)
        try {
          const response = await fetch(`/api/admin/all-in-one/${semesterId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          })
          
          if (response.ok) {
            setHasUnsavedChanges(false)
            setLastSaved(new Date())
            toast.success("Auto-saved", {
              icon: <Clock className="h-4 w-4 text-green-500" />,
              duration: 2000
            })
          }
        } catch (error) {
          console.error('Auto-save failed:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }, 5000) // Auto-save after 5 seconds of inactivity
    
    return () => clearTimeout(autoSaveTimer)
  }, [formData, hasUnsavedChanges, autoSaveEnabled, isLoading, isUpdating, semesterId])

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include",
        })
        const data = await response.json()
        if (data.success && data.user) {
          const userData = {
            ...data.user,
            department: data.user.departments,
            batch: data.user.batches,
            section: data.user.sections,
          }
          setUserContext(userData)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setIsLoadingUser(false)
      }
    }
    fetchUserProfile()
  }, [])

  // Auto-fill section for contributors when user context is loaded
  useEffect(() => {
    if (userContext?.role === "contributor" && userContext?.section?.name && !formData.semester.section) {
      setFormData(prev => ({
        ...prev,
        semester: { ...prev.semester, section: userContext.section.name }
      }))
    }
  }, [userContext, formData.semester.section])

  // Load semester data on mount
  useEffect(() => {
    if (semesterId) {
      loadSemesterData()
    } else {
      router.push('/dashboard/create/bulk')
    }
  }, [semesterId])

  const loadSemesterData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/all-in-one/${semesterId}`)
      if (!response.ok) throw new Error('Failed to load semester data')
      
      const data = await response.json()
      
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
      
      // Extract semester type from title
      if (data.semester) {
        data.semester.selectedSemester = extractSemesterType(data.semester.title)
      }
      
      setFormData(data)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
      
      // Auto-expand first course for better UX
      if (data.courses && data.courses.length > 0) {
        setExpandedCourse(0)
      }
      
      const totalTopics = data.courses?.reduce((sum: number, c: any) => sum + (c.topics?.length || 0), 0) || 0
      toast.success(`Loaded ${data.courses?.length || 0} courses with ${totalTopics} topics`, {
        icon: <Sparkles className="h-4 w-4 text-purple-500" />
      })
    } catch (error) {
      console.error('Error loading semester:', error)
      toast.error('Failed to load semester data')
      router.push('/dashboard/create/bulk')
    } finally {
      setIsLoading(false)
    }
  }, [semesterId, router])

  // Memoized drag handlers
  const handleDragEnd = useCallback((event: DragEndEvent, courseIndex: number) => {
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
  }, [])

  const handleStudyToolDragEnd = useCallback((event: DragEndEvent, courseIndex: number) => {
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
  }, [])

  // Memoized CRUD functions for better performance
  const addCourse = useCallback(() => {
    setFormData(prev => ({ 
      ...prev, 
      courses: [...prev.courses, { 
        title: "", 
        course_code: "", 
        teacher_name: "", 
        teacher_email: "", 
        credits: 3, 
        description: "", 
        is_highlighted: false, 
        topics: [], 
        studyTools: [] 
      }] 
    }))
    setExpandedCourse(formData.courses.length)
    toast.success("New course added", { icon: <Plus className="h-4 w-4 text-green-500" /> })
  }, [formData.courses.length])

  // Filter and search courses - optimized with debounced search
  const filteredCourses = useMemo(() => {
    const courses = formData.courses
    const searchLower = debouncedSearchQuery.toLowerCase()
    
    let filtered = courses
    
    // Apply search filter with debounced query
    if (searchLower) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchLower) ||
        course.course_code.toLowerCase().includes(searchLower) ||
        course.teacher_name.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply type filter
    if (filterType === "highlighted") {
      filtered = filtered.filter(course => course.is_highlighted)
    } else if (filterType === "normal") {
      filtered = filtered.filter(course => !course.is_highlighted)
    }
    
    // Create stable references
    return filtered.map((course) => ({
      course,
      originalIndex: courses.indexOf(course)
    }))
  }, [formData.courses, debouncedSearchQuery, filterType])

  const confirmDelete = useCallback((type: 'course' | 'topic' | 'tool', index: number, parentIndex?: number) => {
    setItemToDelete({ type, index, parentIndex })
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete) return
    
    const { type, index, parentIndex } = itemToDelete
    
    if (type === 'course') {
      setFormData(prev => ({ ...prev, courses: prev.courses.filter((_, i) => i !== index) }))
      setExpandedCourse(prev => prev === index ? null : prev)
      toast.success("Course removed", { icon: <Trash2 className="h-4 w-4 text-red-500" /> })
    } else if (type === 'topic' && parentIndex !== undefined) {
      removeTopic(parentIndex, index)
    } else if (type === 'tool' && parentIndex !== undefined) {
      removeStudyTool(parentIndex, index)
    }
    
    setDeleteConfirmOpen(false)
    setItemToDelete(null)
  }, [itemToDelete])

  const removeCourse = useCallback((index: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.filter((_, i) => i !== index) }))
    setExpandedCourse(prev => prev === index ? null : prev)
    toast.success("Course removed", { icon: <Trash2 className="h-4 w-4 text-red-500" /> })
  }, [])

  const updateCourse = useCallback((index: number, field: keyof CourseData, value: any) => {
    startTransitionUpdate(() => {
      setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === index ? { ...course, [field]: value } : course) }))
    })
  }, [startTransitionUpdate])

  const addTopic = useCallback((courseIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) =>
        i === courseIndex ? { ...course, topics: [...course.topics, { title: "", description: "", order_index: course.topics.length, slides: [], videos: [] }] } : course
      )
    }))
    setExpandedTopic({ courseIndex, topicIndex: formData.courses[courseIndex]?.topics?.length || 0 })
  }, [formData.courses])

  const removeTopic = useCallback((courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.filter((_, j) => j !== topicIndex) } : course) }))
    toast.success("Topic removed", { icon: <Trash2 className="h-4 w-4 text-red-500" /> })
  }, [])

  const updateTopic = useCallback((courseIndex: number, topicIndex: number, field: keyof TopicData, value: any) => {
    startTransitionUpdate(() => {
      setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, [field]: value } : topic) } : course) }))
    })
  }, [startTransitionUpdate])

  const addSlide = useCallback((courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, slides: [...topic.slides, { title: "", url: "", description: "" }] } : topic) } : course) }))
  }, [])

  const removeSlide = useCallback((courseIndex: number, topicIndex: number, slideIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, slides: topic.slides.filter((_, k) => k !== slideIndex) } : topic) } : course) }))
  }, [])

  const updateSlide = useCallback((courseIndex: number, topicIndex: number, slideIndex: number, field: string, value: string) => {
    startTransitionUpdate(() => {
      setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, slides: topic.slides.map((slide, k) => k === slideIndex ? { ...slide, [field]: value } : slide) } : topic) } : course) }))
    })
  }, [startTransitionUpdate])

  const addVideo = useCallback((courseIndex: number, topicIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, videos: [...topic.videos, { title: "", url: "", description: "" }] } : topic) } : course) }))
  }, [])

  const removeVideo = useCallback((courseIndex: number, topicIndex: number, videoIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, videos: topic.videos.filter((_, k) => k !== videoIndex) } : topic) } : course) }))
  }, [])

  const updateVideo = useCallback((courseIndex: number, topicIndex: number, videoIndex: number, field: string, value: string) => {
    startTransitionUpdate(() => {
      setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, topics: course.topics.map((topic, j) => j === topicIndex ? { ...topic, videos: topic.videos.map((video, k) => k === videoIndex ? { ...video, [field]: value } : video) } : topic) } : course) }))
    })
  }, [startTransitionUpdate])

  const addStudyTool = useCallback((courseIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, studyTools: [...course.studyTools, { title: "", type: "previous_questions", content_url: "", exam_type: "both", description: "" }] } : course) }))
  }, [])

  const removeStudyTool = useCallback((courseIndex: number, toolIndex: number) => {
    setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, studyTools: course.studyTools.filter((_, j) => j !== toolIndex) } : course) }))
  }, [])

  const updateStudyTool = useCallback((courseIndex: number, toolIndex: number, field: keyof StudyToolData, value: any) => {
    startTransitionUpdate(() => {
      setFormData(prev => ({ ...prev, courses: prev.courses.map((course, i) => i === courseIndex ? { ...course, studyTools: course.studyTools.map((tool, j) => j === toolIndex ? { ...tool, [field]: value } : tool) } : course) }))
    })
  }, [startTransitionUpdate])

  const validateForm = useCallback((): boolean => {
    if (!formData.semester.selectedSemester) {
      toast.error("Please select a semester (Fall, Summer, or Spring)", { icon: <AlertCircle className="h-4 w-4 text-red-500" /> })
      return false
    }
    if (!formData.semester.title.trim()) { 
      toast.error("Semester title is required", { icon: <AlertCircle className="h-4 w-4 text-red-500" /> })
      return false 
    }
    if (!formData.semester.section.trim()) { 
      toast.error("Section is required", { icon: <AlertCircle className="h-4 w-4 text-red-500" /> })
      return false 
    }
    if (formData.courses.length === 0) { 
      toast.error("At least one course is required", { icon: <AlertCircle className="h-4 w-4 text-red-500" /> })
      return false 
    }
    
    for (let i = 0; i < formData.courses.length; i++) {
      const course = formData.courses[i]
      if (!course.title.trim()) { toast.error(`Course ${i + 1}: Title is required`); return false }
      if (!course.course_code.trim()) { toast.error(`Course ${i + 1}: Course code is required`); return false }
      if (!course.teacher_name.trim()) { toast.error(`Course ${i + 1}: Teacher name is required`); return false }
    }
    return true
  }, [formData])

  const handleSubmit = useCallback(async () => {
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

      setHasUnsavedChanges(false)
      setLastSaved(new Date())
      toast.success("Semester updated successfully!", {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      })
      router.push('/dashboard/create/bulk')
    } catch (error: any) {
      console.error('Error updating semester:', error)
      toast.error(error.message || 'Failed to update semester')
    } finally {
      setIsUpdating(false)
    }
  }, [validateForm, semesterId, formData, router])

  // Show loading skeleton
  if (isLoading) {
    return <PageSkeleton />
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
          
          {/* Enhanced Header with Auto-save & Status */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                asChild
                className="rounded-full hover:bg-accent"
              >
                <Link href="/dashboard/create/bulk">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Edit Semester
                  </h1>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                        Unsaved
                      </Badge>
                    )}
                    {isSaving && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Saving...
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.semester.title || "Update semester details, courses & materials"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border">
                <Switch
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                  id="auto-save"
                />
                <Label htmlFor="auto-save" className="text-xs font-medium cursor-pointer">Auto-save</Label>
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
              
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-xs text-muted-foreground border">
                <Keyboard className="h-3.5 w-3.5" />
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded shadow-sm">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded shadow-sm">S</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Semester Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Semester Information</CardTitle>
                    <CardDescription>Configure semester details and settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Semester Selection with Checkboxes */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Select Semester <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    {(['Fall', 'Summer', 'Spring'] as const).map((semester) => (
                      <div key={semester} className="flex items-center space-x-2">
                        <Checkbox
                          id={`semester-${semester}`}
                          checked={formData.semester.selectedSemester === semester}
                          onCheckedChange={(checked) => {
                            const newSemester = checked ? semester : null
                            const generatedTitle = generateSemesterTitle(newSemester)
                            setFormData(prev => ({
                              ...prev,
                              semester: { 
                                ...prev.semester, 
                                selectedSemester: newSemester,
                                title: generatedTitle
                              }
                            }))
                          }}
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`semester-${semester}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {semester}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.semester.selectedSemester && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Will be saved as: <strong>{formData.semester.title}</strong></span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      <Users className="h-4 w-4 inline mr-2" />
                      Section <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g., 63 G"
                      value={formData.semester.section}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        semester: { ...prev.semester, section: e.target.value }
                      }))}
                      readOnly={isContributor && userContext?.section?.name}
                      disabled={isContributor && userContext?.section?.name}
                    />
                    {isContributor && userContext?.section?.name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Auto-filled from your profile
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    <FileText className="h-4 w-4 inline mr-2" />
                    Description
                  </Label>
                  <Textarea
                    placeholder="Describe the semester..."
                    value={formData.semester.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      semester: { ...prev.semester, description: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>
                      <Calendar className="h-4 w-4 inline mr-2" />
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
                    <Label>
                      <Calendar className="h-4 w-4 inline mr-2" />
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
                    <Label>Default Credits</Label>
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

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.semester.has_midterm}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        semester: { ...prev.semester, has_midterm: checked }
                      }))}
                    />
                    <Label className="cursor-pointer">Has Midterm</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.semester.has_final}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        semester: { ...prev.semester, has_final: checked }
                      }))}
                    />
                    <Label className="cursor-pointer">Has Final</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.semester.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        semester: { ...prev.semester, is_active: checked }
                      }))}
                    />
                    <Label className="cursor-pointer">
                      ✨ Set as Active
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Courses Section */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b-2 border-purple-200 dark:border-purple-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 shadow-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                        Courses
                        <Badge className="bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300">
                          {formData.courses.length}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Manage courses with topics and materials</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.courses.length > 1 && (
                      <Button
                        onClick={() => {
                          if (expandedCourse !== null) {
                            setExpandedCourse(null)
                          } else {
                            setExpandedCourse(0)
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600/50 border border-slate-300 dark:border-slate-600/50"
                      >
                        {expandedCourse !== null ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1.5" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1.5" />
                            Expand
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      onClick={addCourse} 
                      size="sm"
                      className="h-9 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/20 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Course
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
            {formData.courses.length === 0 ? (
              <div className="text-center py-12 sm:py-16 border-2 border-dashed border-purple-200 dark:border-purple-700/50 rounded-xl sm:rounded-2xl bg-purple-50/50 dark:bg-purple-900/20 transition-colors hover:border-purple-300 dark:hover:border-purple-600/50">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shadow-lg">
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">No courses yet</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-sm mx-auto px-4">Start building your semester by adding your first course with topics and materials</p>
                <Button 
                  onClick={addCourse} 
                  size="lg"
                  className="h-11 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/20"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Course
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map(({ course, originalIndex }, displayIndex) => (
                  <Card 
                    key={originalIndex} 
                    className={cn(
                      "overflow-hidden transition-all duration-200 border-2 shadow-md hover:shadow-lg",
                      course.is_highlighted
                        ? "border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50",
                      expandedCourse === originalIndex 
                        ? "ring-4 ring-purple-400 dark:ring-purple-500/40 shadow-xl border-purple-500" 
                        : ""
                    )}
                  >
                    <CardHeader className={cn(
                      "pb-3 border-b-2 p-3 sm:p-4",
                      course.is_highlighted
                        ? "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-300 dark:border-amber-700"
                        : "bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/70 dark:to-slate-800/50 border-slate-300 dark:border-slate-700"
                    )}>
                      <div 
                        className="flex items-center justify-between gap-3 cursor-pointer group"
                        onClick={() => setExpandedCourse(expandedCourse === originalIndex ? null : originalIndex)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedCourse(expandedCourse === originalIndex ? null : originalIndex) }}
                        aria-expanded={expandedCourse === originalIndex}
                      >
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                          <Badge className="shrink-0 bg-gradient-to-r from-purple-600 to-violet-600 text-white border-0">
                            {originalIndex + 1}
                          </Badge>
                          <span className="font-semibold truncate text-sm sm:text-base">
                            {course.title || <span className="text-muted-foreground italic">Untitled Course</span>}
                          </span>
                          {course.course_code && (
                            <Badge variant="outline" className="font-mono text-xs shrink-0 bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                              {course.course_code}
                            </Badge>
                          )}
                          {course.is_highlighted && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0 drop-shadow-sm" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Highlighted course</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <div className="flex gap-2 text-xs text-muted-foreground ml-auto">
                            <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md">
                              <Layers className="h-3 w-3" />
                              {course.topics?.length || 0}
                            </span>
                            <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                              <ClipboardList className="h-3 w-3" />
                              {course.studyTools?.length || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={cn(
                            "p-1.5 rounded-lg transition-all duration-150",
                            expandedCourse === originalIndex 
                              ? "bg-purple-100 dark:bg-purple-900/50" 
                              : "bg-slate-100 dark:bg-slate-700/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-600/50"
                          )}>
                            {expandedCourse === originalIndex 
                              ? <ChevronUp className="h-4 w-4 text-purple-600 dark:text-purple-400" /> 
                              : <ChevronDown className="h-4 w-4" />
                            }
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  confirmDelete('course', originalIndex)
                                }}
                                className="h-8 w-8 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/30 opacity-60 group-hover:opacity-100 transition-all duration-150"
                                aria-label="Remove course"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs">Remove course</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardHeader>
                    {expandedCourse === originalIndex && (
                      <CardContent className="space-y-4 pt-0 pb-4 px-3 sm:px-4 animate-in slide-in-from-top-2 duration-200">
                        <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                        
                        {/* Course Basic Info */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 border-2 border-blue-200 dark:border-blue-800/50">
                          <h5 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 shadow-md">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            Course Details
                          </h5>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                Title <span className="text-red-500 dark:text-red-400">*</span>
                              </Label>
                              <Input
                                placeholder="e.g., Data Structures"
                                value={course.title}
                                onChange={(e) => updateCourse(originalIndex, "title", e.target.value)}
                                className="h-9 sm:h-10 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                Course Code <span className="text-red-500 dark:text-red-400">*</span>
                              </Label>
                              <Input
                                placeholder="e.g., CSE201"
                                value={course.course_code}
                                onChange={(e) => updateCourse(originalIndex, "course_code", e.target.value)}
                                className="h-9 sm:h-10 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                Teacher Name <span className="text-red-500 dark:text-red-400">*</span>
                              </Label>
                              <Input
                                placeholder="e.g., Dr. John Doe"
                                value={course.teacher_name}
                                onChange={(e) => updateCourse(originalIndex, "teacher_name", e.target.value)}
                                className="h-9 sm:h-10 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Teacher Email</Label>
                              <Input
                                placeholder="teacher@example.com"
                                type="email"
                                value={course.teacher_email}
                                onChange={(e) => updateCourse(originalIndex, "teacher_email", e.target.value)}
                                className="h-9 sm:h-10 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Credits</Label>
                              <Input
                                type="number"
                                min="1"
                                max="6"
                                value={course.credits}
                                onChange={(e) => updateCourse(originalIndex, "credits", parseInt(e.target.value) || 3)}
                                className="h-9 sm:h-10 rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-2 flex items-end">
                              <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/30 px-3 sm:px-4 py-2 rounded-lg border border-yellow-200 dark:border-yellow-700/50">
                                <Switch
                                  checked={course.is_highlighted}
                                  onCheckedChange={(checked) => updateCourse(originalIndex, "is_highlighted", checked)}
                                />
                                <Label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  Highlight Course
                                </Label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Description</Label>
                            <Textarea
                              placeholder="Course description..."
                              value={course.description}
                              onChange={(e) => updateCourse(originalIndex, "description", e.target.value)}
                              rows={2}
                              className="resize-none rounded-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>
                        </div>

                        {/* Topics Section */}
                        <div className="space-y-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-800">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h4 className="text-lg font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md">
                                <Layers className="h-5 w-5 text-white" />
                              </div>
                              Topics
                              <Badge className="ml-1 bg-indigo-600 text-white border-0">{course.topics?.length || 0}</Badge>
                            </h4>
                            <Button
                              onClick={() => addTopic(originalIndex)}
                              size="sm"
                              className="h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                            >
                              <Plus className="h-4 w-4 mr-1.5" />
                              Add Topic
                            </Button>
                          </div>

                          {course.topics && course.topics.length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleDragEnd(event, originalIndex)}
                            >
                              <SortableContext
                                items={course.topics.map((_, i) => `topic-${originalIndex}-${i}`)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {course.topics.map((topic, topicIndex) => (
                                    <SortableTopic
                                      key={topicIndex}
                                      topic={topic}
                                      topicIndex={topicIndex}
                                      courseIndex={originalIndex}
                                      isExpanded={
                                        expandedTopic?.courseIndex === originalIndex &&
                                        expandedTopic?.topicIndex === topicIndex
                                      }
                                      onToggle={() => {
                                        if (
                                          expandedTopic?.courseIndex === originalIndex &&
                                          expandedTopic?.topicIndex === topicIndex
                                        ) {
                                          setExpandedTopic(null)
                                        } else {
                                          setExpandedTopic({ courseIndex: originalIndex, topicIndex })
                                        }
                                      }}
                                      onRemove={() => removeTopic(originalIndex, topicIndex)}
                                      onUpdate={(field: string, value: any) =>
                                        updateTopic(originalIndex, topicIndex, field as keyof TopicData, value)
                                      }
                                      onAddSlide={() => addSlide(originalIndex, topicIndex)}
                                      onRemoveSlide={(slideIndex: number) =>
                                        removeSlide(originalIndex, topicIndex, slideIndex)
                                      }
                                      onUpdateSlide={(slideIndex: number, field: string, value: string) =>
                                        updateSlide(originalIndex, topicIndex, slideIndex, field, value)
                                      }
                                      onAddVideo={() => addVideo(originalIndex, topicIndex)}
                                      onRemoveVideo={(videoIndex: number) =>
                                        removeVideo(originalIndex, topicIndex, videoIndex)
                                      }
                                      onUpdateVideo={(videoIndex: number, field: string, value: string) =>
                                        updateVideo(originalIndex, topicIndex, videoIndex, field, value)
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
                            <h4 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-200">
                              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/50">
                                <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              Study Tools
                              <Badge variant="secondary" className="ml-1 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300">{course.studyTools?.length || 0}</Badge>
                            </h4>
                            <Button
                              onClick={() => addStudyTool(originalIndex)}
                              size="sm"
                              className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Add Tool
                            </Button>
                          </div>

                          {course.studyTools && course.studyTools.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-blue-200 dark:border-blue-700/50 rounded-xl bg-blue-50/50 dark:bg-blue-900/20">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">No study tools added</p>
                              <Button 
                                onClick={() => addStudyTool(originalIndex)} 
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
                              onDragEnd={(event: DragEndEvent) => handleStudyToolDragEnd(event, originalIndex)}
                            >
                              <SortableContext
                                items={course.studyTools?.map((_, idx) => `studytool-${originalIndex}-${idx}`) || []}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {course.studyTools?.map((tool, toolIndex) => (
                                    <StudyToolCard
                                      key={toolIndex}
                                      tool={tool}
                                      toolIndex={toolIndex}
                                      courseIndex={originalIndex}
                                      isExpanded={
                                        expandedStudyTool?.courseIndex === originalIndex &&
                                        expandedStudyTool?.toolIndex === toolIndex
                                      }
                                      onToggle={() => {
                                        if (
                                          expandedStudyTool?.courseIndex === originalIndex &&
                                          expandedStudyTool?.toolIndex === toolIndex
                                        ) {
                                          setExpandedStudyTool(null)
                                        } else {
                                          setExpandedStudyTool({ courseIndex: originalIndex, toolIndex })
                                        }
                                      }}
                                      onRemove={() => removeStudyTool(originalIndex, toolIndex)}
                                      onUpdate={(field: string, value: any) => 
                                        updateStudyTool(originalIndex, toolIndex, field as keyof StudyToolData, value)
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
          </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-30 mt-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/create/bulk')}
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              {hasUnsavedChanges && (
                <Button
                  variant="ghost"
                  onClick={loadSemesterData}
                  className="text-orange-600 dark:text-orange-400 flex-1 sm:flex-none"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-3">
              {lastSaved && (
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              
              <Button
                onClick={handleSubmit}
                disabled={isUpdating || !formData.semester.title || !formData.semester.section || formData.courses.length === 0}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg"
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
        </div>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                {itemToDelete?.type === 'course' && "Are you sure you want to delete this course? This will remove all topics, slides, videos, and study tools associated with it."}
                {itemToDelete?.type === 'topic' && "Are you sure you want to delete this topic? This will remove all slides and videos in this topic."}
                {itemToDelete?.type === 'tool' && "Are you sure you want to delete this study tool?"}
                <br /><br />
                <strong className="text-red-600 dark:text-red-400">This action cannot be undone.</strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setItemToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function EditBulkCreatorPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditPageContent />
    </Suspense>
  )
}