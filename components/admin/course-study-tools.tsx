"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, FileText, BookOpen, Users, ExternalLink, Share2, BarChart3 } from "lucide-react"
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
}

interface CourseStudyToolsProps {
  courseId: string
}

export function CourseStudyTools({ courseId }: CourseStudyToolsProps) {
  const [studyTools, setStudyTools] = useState<StudyTool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTool, setEditingTool] = useState<any>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchStudyTools()
  }, [courseId])

  const fetchStudyTools = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/courses/${courseId}/study-tools`)
      if (!response.ok) {
        throw new Error("Failed to fetch study tools")
      }
      const data = await response.json()
      setStudyTools(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load study tools")
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
    } catch (error) {
      console.error("Error deleting study tool:", error)
      alert("Failed to delete study tool")
    }
  }

  const handleEdit = (tool: StudyTool) => {
    // Transform the tool to match the expected interface for the edit dialog
    const toolWithCourse = {
      ...tool,
      course: {
        id: courseId,
        title: "", // We don't have course title here, but it's not used in the edit dialog
        course_code: "",
      },
    }
    setEditingTool(toolWithCourse)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditingTool(null)
    fetchStudyTools()
  }

  if (loading) {
    return <div className="text-center py-6">Loading study tools...</div>
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error loading study tools: {error}</div>
  }

  if (!studyTools || studyTools.length === 0) {
    return (
      <div className="text-center py-6">
        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No study tools yet. Add exam materials and resources.</p>
      </div>
    )
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
    switch (examType) {
      case "midterm":
        return (
          <Badge variant="outline" className="text-xs">
            Midterm
          </Badge>
        )
      case "final":
        return (
          <Badge variant="outline" className="text-xs">
            Final
          </Badge>
        )
      case "both":
        return (
          <Badge variant="secondary" className="text-xs">
            Both
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      {studyTools.map((tool) => (
        <div key={tool.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-muted-foreground">{getStudyToolIcon(tool.type)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{tool.title}</h4>
                {getExamTypeBadge(tool.exam_type)}
              </div>
              <p className="text-xs text-muted-foreground">{getStudyToolLabel(tool.type)}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {tool.content_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={tool.content_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            <ShareButton
              url={generateShareUrl('study-tool', tool.id)}
              title={`${tool.title} - Study Tool`}
              description={`${tool.type.replace('_', ' ').toUpperCase()} study material`}
              size="sm"
              variant="ghost"
            />
            <Button variant="ghost" size="sm" onClick={() => handleEdit(tool)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(tool.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

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
