"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  Eye, 
  FileText, 
  BookOpen, 
  ClipboardList, 
  GraduationCap,
  FileQuestion,
  BookMarked,
  FlaskConical,
  Library,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Calendar,
  Loader2,
  SlidersHorizontal,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"

// Type definitions
interface Course {
  id: string
  title: string
  course_code: string
  teacher_name?: string
}

interface Resource {
  id: string
  title: string
  description: string | null
  type: string
  content_url: string | null
  course_id: string | null
  exam_type: string | null
  file_size_mb: number | null
  file_format: string | null
  academic_year: string | null
  is_downloadable: boolean
  download_count: number
  view_count: number
  created_at: string
  updated_at: string
  course: Course | null
}

interface Filters {
  types: string[]
  courses: Course[]
  examTypes: string[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Resource type icons and labels
const resourceTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  previous_questions: { 
    icon: FileQuestion, 
    label: "Previous Questions", 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30"
  },
  exam_note: { 
    icon: BookOpen, 
    label: "Exam Notes", 
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30"
  },
  syllabus: { 
    icon: ClipboardList, 
    label: "Syllabus", 
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30"
  },
  mark_distribution: { 
    icon: GraduationCap, 
    label: "Mark Distribution", 
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30"
  },
  assignment: { 
    icon: FileText, 
    label: "Assignment", 
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30"
  },
  lab_manual: { 
    icon: FlaskConical, 
    label: "Lab Manual", 
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30"
  },
  reference_book: { 
    icon: Library, 
    label: "Reference Book", 
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30"
  }
}

const examTypeLabels: Record<string, string> = {
  midterm: "Midterm",
  final: "Final",
  both: "Both",
  assignment: "Assignment",
  quiz: "Quiz"
}

export default function ResourcesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [resources, setResources] = useState<Resource[]>([])
  const [filters, setFilters] = useState<Filters>({ types: [], courses: [], examTypes: [] })
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  
  // Selected filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedExamType, setSelectedExamType] = useState<string>("")
  const [selectedSemester, setSelectedSemester] = useState<string>("")
  
  // Collapsible sections
  const [typeSectionOpen, setTypeSectionOpen] = useState(true)
  const [courseSectionOpen, setCourseSectionOpen] = useState(true)
  const [examTypeSectionOpen, setExamTypeSectionOpen] = useState(true)
  const [semesterSectionOpen, setSemesterSectionOpen] = useState(true)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch resources
  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (selectedTypes.length === 1) {
        params.append("type", selectedTypes[0])
      }
      if (selectedCourse) params.append("courseId", selectedCourse)
      if (selectedExamType) params.append("examType", selectedExamType)
      if (selectedSemester) params.append("semester", selectedSemester)
      if (debouncedSearch) params.append("search", debouncedSearch)
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())

      const response = await fetch(`/api/resources?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        // Client-side filter for multiple types
        let filteredResources = data.resources
        if (selectedTypes.length > 1) {
          filteredResources = data.resources.filter((r: Resource) => 
            selectedTypes.includes(r.type)
          )
        }
        setResources(filteredResources)
        setPagination(data.pagination)
        setFilters(data.filters)
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedTypes, selectedCourse, selectedExamType, selectedSemester, debouncedSearch, pagination.page, pagination.limit])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTypes([])
    setSelectedCourse("")
    setSelectedExamType("")
    setSelectedSemester("")
    setSearchQuery("")
    setDebouncedSearch("")
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Count active filters
  const activeFilterCount = selectedTypes.length + (selectedCourse ? 1 : 0) + (selectedExamType ? 1 : 0) + (selectedSemester ? 1 : 0)

  // Create URL-friendly slug from title
  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  // Open resource - Navigate to detail page using title slug
  const openResource = (resource: Resource) => {
    const slug = createSlug(resource.title)
    router.push(`/Resources/${slug}-${resource.id.slice(0, 8)}`)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  // Filter sidebar component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn(
      "flex flex-col h-full",
      isMobile ? "p-4" : "p-4"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        {/* Resource Type Filter */}
        <div className="mb-6">
          <button
            onClick={() => setTypeSectionOpen(!typeSectionOpen)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <span>Resource Type</span>
            {typeSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {typeSectionOpen && (
            <div className="mt-2 space-y-2">
              {filters.types.map((type) => {
                const config = resourceTypeConfig[type] || { 
                  icon: FileText, 
                  label: type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                  color: "text-gray-600",
                  bgColor: "bg-gray-100"
                }
                const Icon = config.icon
                const isSelected = selectedTypes.includes(type)
                
                return (
                  <label
                    key={type}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                      isSelected 
                        ? "bg-primary/10 border border-primary/30" 
                        : "hover:bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTypeFilter(type)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-sm flex-1">{config.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {resources.filter(r => r.type === type).length || 0}
                    </Badge>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Course Filter */}
        <div className="mb-6">
          <button
            onClick={() => setCourseSectionOpen(!courseSectionOpen)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <span>Course</span>
            {courseSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {courseSectionOpen && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => {
                  setSelectedCourse("")
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  !selectedCourse 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                All Courses
              </button>
              {filters.courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course.id)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedCourse === course.id 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{course.course_code}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {course.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Exam Type Filter */}
        <div className="mb-6">
          <button
            onClick={() => setExamTypeSectionOpen(!examTypeSectionOpen)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <span>Exam Type</span>
            {examTypeSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {examTypeSectionOpen && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => {
                  setSelectedExamType("")
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  !selectedExamType 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                All Types
              </button>
              {filters.examTypes.map((examType) => (
                <button
                  key={examType}
                  onClick={() => {
                    setSelectedExamType(examType)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedExamType === examType 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted"
                  )}
                >
                  {examTypeLabels[examType] || examType}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Semester Filter */}
        <div className="mb-6">
          <button
            onClick={() => setSemesterSectionOpen(!semesterSectionOpen)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <span>Semester</span>
            {semesterSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {semesterSectionOpen && (
            <div className="mt-2 space-y-2">
              {["Fall", "Summer", "Spring"].map((season) => {
                const currentYear = new Date().getFullYear()
                const shortYear = currentYear % 100
                const semesterValue = `${season} ${shortYear}`
                const isSelected = selectedSemester === semesterValue
                
                return (
                  <label
                    key={season}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                      isSelected 
                        ? "bg-primary/10 border border-primary/30" 
                        : "hover:bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {
                        setSelectedSemester(isSelected ? "" : semesterValue)
                        setPagination(prev => ({ ...prev, page: 1 }))
                      }}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{season}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )

  // Resource Card Component
  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const config = resourceTypeConfig[resource.type] || { 
      icon: FileText, 
      label: resource.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800"
    }
    const Icon = config.icon

    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50 hover:border-primary/30 cursor-pointer"
        onClick={() => openResource(resource)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <Badge variant="outline" className={cn("text-xs", config.color)}>
              {config.label}
            </Badge>
          </div>
          <CardTitle className="text-base font-semibold line-clamp-2 mt-3 group-hover:text-primary transition-colors">
            {resource.title}
          </CardTitle>
          {resource.course && (
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <BookMarked className="w-3.5 h-3.5" />
              <span className="font-medium">{resource.course.course_code}</span>
              <span className="text-muted-foreground">•</span>
              <span className="truncate">{resource.course.title}</span>
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="pb-3">
          {resource.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {resource.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">
              No description available
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-3">
            {resource.exam_type && (
              <Badge variant="secondary" className="text-xs">
                {examTypeLabels[resource.exam_type] || resource.exam_type}
              </Badge>
            )}
            {resource.file_format && (
              <Badge variant="outline" className="text-xs uppercase">
                {resource.file_format}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {resource.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              {resource.download_count || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => openResource(resource)}
              className="gap-1.5"
            >
              <Eye className="w-4 h-4" />
              View
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }

  // Resource List Item Component
  const ResourceListItem = ({ resource }: { resource: Resource }) => {
    const config = resourceTypeConfig[resource.type] || { 
      icon: FileText, 
      label: resource.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800"
    }
    const Icon = config.icon

    return (
      <Card 
        className="group hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
        onClick={() => openResource(resource)}
      >
        <div className="flex items-center p-4 gap-4">
          <div className={cn("p-3 rounded-lg shrink-0", config.bgColor)}>
            <Icon className={cn("w-6 h-6", config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                  {resource.title}
                </h3>
                {resource.course && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    <span className="font-medium">{resource.course.course_code}</span>
                    <span className="mx-1">•</span>
                    <span>{resource.course.title}</span>
                  </p>
                )}
                {resource.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {resource.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn("text-xs", config.color)}>
                    {config.label}
                  </Badge>
                  {resource.exam_type && (
                    <Badge variant="secondary" className="text-xs">
                      {examTypeLabels[resource.exam_type] || resource.exam_type}
                    </Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground hidden md:block">
                  {formatDate(resource.created_at)}
                </div>
                
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation()
                    openResource(resource)
                  }}
                  className="gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className={cn(
      viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-3"
    )}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="w-20 h-5 rounded-full" />
            </div>
            <Skeleton className="w-3/4 h-5 mt-3" />
            <Skeleton className="w-1/2 h-4 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-10" />
          </CardContent>
          <CardFooter className="pt-3 border-t">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-20 h-8 ml-auto" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/")}
              className="gap-1.5 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Study Resources</h1>
              <p className="text-muted-foreground mt-1">
                Browse and download study materials, notes, and previous questions
              </p>
            </div>
            <Badge variant="outline" className="w-fit text-sm py-1.5 px-3">
              {pagination.total} Resources Available
            </Badge>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className={cn(
            "hidden lg:block shrink-0 transition-all duration-300",
            sidebarOpen ? "w-72" : "w-0 overflow-hidden"
          )}>
            <div className="sticky top-20 bg-card rounded-xl border shadow-sm h-[calc(100vh-8rem)] overflow-hidden">
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => {
                      setSearchQuery("")
                      setDebouncedSearch("")
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* View Toggle & Mobile Filter */}
              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden gap-2"
                  onClick={() => setMobileFilterOpen(true)}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {/* Desktop Sidebar Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden lg:flex"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>

                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedTypes.map(type => {
                  const config = resourceTypeConfig[type]
                  return (
                    <Badge 
                      key={type} 
                      variant="secondary" 
                      className="gap-1.5 pr-1"
                    >
                      {config?.label || type}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => toggleTypeFilter(type)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )
                })}
                {selectedCourse && (
                  <Badge variant="secondary" className="gap-1.5 pr-1">
                    {filters.courses.find(c => c.id === selectedCourse)?.course_code || "Course"}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSelectedCourse("")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {selectedExamType && (
                  <Badge variant="secondary" className="gap-1.5 pr-1">
                    {examTypeLabels[selectedExamType] || selectedExamType}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSelectedExamType("")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}

            {/* Content */}
            {loading ? (
              <LoadingSkeleton />
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                <p className="text-muted-foreground max-w-md">
                  {debouncedSearch || activeFilterCount > 0
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "There are no resources available at the moment."}
                </p>
                {activeFilterCount > 0 && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <ResourceListItem key={resource.id} resource={resource} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-9"
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-card shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">Filters</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setMobileFilterOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="h-[calc(100vh-4rem)] overflow-y-auto">
              <FilterSidebar isMobile />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
