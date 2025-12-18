"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  ExternalLink,
  MoreHorizontal,
  FileQuestion,
  BookOpen,
  ClipboardList,
  GraduationCap,
  FileText,
  FlaskConical,
  Library,
  RefreshCw,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Course {
  id: string
  title: string
  course_code: string
  teacher_name?: string
  semester?: {
    id: string
    title: string
    section: string
  }
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

interface AdminResourcesListProps {
  typeFilter?: string
  onEdit: (resource: Resource) => void
  onRefresh?: () => void
  refreshKey?: number
}

const resourceTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  previous_questions: { icon: FileQuestion, label: "Previous Questions", color: "text-blue-600" },
  exam_note: { icon: BookOpen, label: "Exam Notes", color: "text-emerald-600" },
  syllabus: { icon: ClipboardList, label: "Syllabus", color: "text-purple-600" },
  mark_distribution: { icon: GraduationCap, label: "Mark Distribution", color: "text-amber-600" },
  assignment: { icon: FileText, label: "Assignment", color: "text-rose-600" },
  lab_manual: { icon: FlaskConical, label: "Lab Manual", color: "text-cyan-600" },
  reference_book: { icon: Library, label: "Reference Book", color: "text-indigo-600" }
}

const examTypeLabels: Record<string, string> = {
  midterm: "Midterm",
  final: "Final",
  both: "Both",
  assignment: "Assignment",
  quiz: "Quiz"
}

export function AdminResourcesList({ 
  typeFilter, 
  onEdit, 
  onRefresh,
  refreshKey = 0 
}: AdminResourcesListProps) {
  const { toast } = useToast()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState(typeFilter || "all")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [selectedExamType, setSelectedExamType] = useState("all")
  const [courses, setCourses] = useState<Course[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedType && selectedType !== "all") params.append("type", selectedType)
      if (selectedCourse && selectedCourse !== "all") params.append("courseId", selectedCourse)
      if (selectedExamType && selectedExamType !== "all") params.append("examType", selectedExamType)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/admin/resources?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setResources(data.resources)
        if (data.filters?.courses) {
          setCourses(data.filters.courses)
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch resources",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error)
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedCourse, selectedExamType, searchQuery, toast])

  useEffect(() => {
    fetchResources()
  }, [fetchResources, refreshKey])

  useEffect(() => {
    if (typeFilter) {
      setSelectedType(typeFilter)
    }
  }, [typeFilter])

  const handleDelete = async () => {
    if (!resourceToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/resources/${resourceToDelete.id}`, {
        method: "DELETE"
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Resource deleted successfully"
        })
        fetchResources()
        onRefresh?.()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete resource",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setResourceToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const openResource = (url: string | null) => {
    if (url) {
      window.open(url, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="border rounded-lg">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {!typeFilter && (
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(resourceTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.course_code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedExamType} onValueChange={setSelectedExamType}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Exam Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exam Types</SelectItem>
            {Object.entries(examTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={fetchResources}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Found {resources.length} resource{resources.length !== 1 ? "s" : ""}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Exam Type</TableHead>
              <TableHead className="text-center">Views</TableHead>
              <TableHead className="text-center">Downloads</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => {
                const config = resourceTypeConfig[resource.type] || {
                  icon: FileText,
                  label: resource.type,
                  color: "text-gray-600"
                }
                const TypeIcon = config.icon

                return (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-muted", config.color)}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{resource.title}</p>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resource.course ? (
                        <div>
                          <p className="font-medium text-sm">{resource.course.course_code}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {resource.course.title}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {resource.exam_type ? (
                        <Badge variant="secondary">
                          {examTypeLabels[resource.exam_type] || resource.exam_type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                        {resource.view_count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Download className="w-3.5 h-3.5" />
                        {resource.download_count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(resource.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(resource)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {resource.content_url && (
                            <DropdownMenuItem onClick={() => openResource(resource.content_url)}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open Link
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setResourceToDelete(resource)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resourceToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
