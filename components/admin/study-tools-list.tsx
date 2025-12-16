"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, FileText, BookOpen, Users, ExternalLink, Search, Share2, BarChart3 } from "lucide-react"
import { EditStudyToolDialog } from "@/components/admin/edit-study-tool-dialog"
import { ShareButton } from "@/components/share-button"
import { generateShareUrl } from "@/lib/share-utils"

interface StudyTool {
  id: string
  title: string
  type: string
  content_url: string | null
  exam_type: string
  created_at: string
  updated_at: string
  course: {
    id: string
    title: string
    course_code: string
    semester: {
      name: string
    }
  }
}

interface StudyToolsListProps {
  onRefresh?: () => void
}

export function StudyToolsList({ onRefresh }: StudyToolsListProps) {
  const [studyTools, setStudyTools] = useState<StudyTool[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [examTypeFilter, setExamTypeFilter] = useState<string>("all")
  const [editingTool, setEditingTool] = useState<StudyTool | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchStudyTools()
  }, [])

  const fetchStudyTools = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/study-tools")
      if (!response.ok) {
        throw new Error("Failed to fetch study tools")
      }
      const data = await response.json()
      setStudyTools(data)
    } catch (error) {
      console.error("Error fetching study tools:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study tool?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/study-tools/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete study tool")
      }

      await fetchStudyTools()
      onRefresh?.()
    } catch (error) {
      console.error("Error deleting study tool:", error)
      alert("Failed to delete study tool")
    }
  }

  const handleEdit = (tool: StudyTool) => {
    setEditingTool(tool)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditingTool(null)
    fetchStudyTools()
    onRefresh?.()
  }

  const getStudyToolIcon = (type: string) => {
    switch (type) {
      case "previous_questions":
        return <FileText className="h-4 w-4" />
      case "exam_note":
        return <BookOpen className="h-4 w-4" />
      case "syllabus":
        return <FileText className="h-4 w-4" />
      case "mark_distribution":
        return <BarChart3 className="h-4 w-4" />
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

  const getExamTypeBadge = (examType: string) => {
    const variants = {
      midterm: "default" as const,
      final: "secondary" as const,
      both: "outline" as const,
    }

    return (
      <Badge variant={variants[examType as keyof typeof variants] || "outline"} className="text-xs">
        {examType === "both" ? "Both" : examType.charAt(0).toUpperCase() + examType.slice(1)}
      </Badge>
    )
  }

  // Filter study tools based on search and filters
  const filteredStudyTools = studyTools.filter((tool) => {
    const matchesSearch = 
      tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === "all" || tool.type === typeFilter
    const matchesExamType = examTypeFilter === "all" || tool.exam_type === examTypeFilter

    return matchesSearch && matchesType && matchesExamType
  })

  if (loading) {
    return <div className="text-center py-6">Loading study tools...</div>
  }

  if (studyTools.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No study tools found</h3>
        <p className="text-muted-foreground mb-6">Get started by creating your first study tool using the button above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search study tools, courses, or codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="previous_questions">Previous Questions</SelectItem>
            <SelectItem value="exam_note">Exam Notes</SelectItem>
            <SelectItem value="syllabus">Syllabus</SelectItem>
            <SelectItem value="mark_distribution">Mark Distribution</SelectItem>
          </SelectContent>
        </Select>
        <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            <SelectItem value="midterm">Midterm Only</SelectItem>
            <SelectItem value="final">Final Only</SelectItem>
            <SelectItem value="both">Both Exams</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredStudyTools.length} of {studyTools.length} study tools
      </div>

      {/* Study Tools Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Study Tool</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Exam</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudyTools.map((tool) => (
            <TableRow key={tool.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground">{getStudyToolIcon(tool.type)}</div>
                  <div>
                    <div className="font-medium">{tool.title}</div>
                    <div className="text-xs text-muted-foreground">{getStudyToolLabel(tool.type)}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{tool.course.title}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {tool.course.course_code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{tool.course.semester.name}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{getStudyToolLabel(tool.type)}</Badge>
              </TableCell>
              <TableCell>{getExamTypeBadge(tool.exam_type)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(tool.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {tool.content_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={tool.content_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <ShareButton
                    url={generateShareUrl('study-tool', tool.id)}
                    title={`${tool.title} - ${tool.course.title}`}
                    description={`${tool.type.replace('_', ' ').toUpperCase()} for ${tool.course.title} course`}
                    size="sm"
                    variant="ghost"
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(tool)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tool.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <EditStudyToolDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        studyTool={editingTool}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
