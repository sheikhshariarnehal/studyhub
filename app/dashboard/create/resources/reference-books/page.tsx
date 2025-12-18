"use client"

import { useState } from "react"
import { Plus, Library } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminResourcesList } from "@/components/admin/admin-resources-list"
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog"

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
  course: {
    id: string
    title: string
    course_code: string
    teacher_name?: string
    semester?: {
      id: string
      title: string
      section: string
    }
  } | null
}

export default function ReferenceBooksPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setSelectedResource(null)
    setFormOpen(true)
  }

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Library className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reference Books</h1>
            <p className="text-muted-foreground">
              Manage reference books and reading materials
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Reference Book
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reference Books</CardTitle>
          <CardDescription>
            Textbooks and reference materials for courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminResourcesList 
            typeFilter="reference_book"
            onEdit={handleEdit} 
            onRefresh={handleSuccess}
            refreshKey={refreshKey}
          />
        </CardContent>
      </Card>

      <ResourceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        resource={selectedResource}
        defaultType="reference_book"
        onSuccess={handleSuccess}
      />
    </div>
  )
}
