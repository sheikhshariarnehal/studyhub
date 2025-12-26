"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  GraduationCap,
  Calendar,
  BookOpen,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface Semester {
  id: string
  title: string
  description: string | null
  section: string
  has_midterm: boolean
  has_final: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  start_date: string | null
  end_date: string | null
  default_credits: number
}

export default function DashboardSemesterPage() {
  const router = useRouter()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    section: "",
    has_midterm: true,
    has_final: true,
    start_date: "",
    end_date: "",
    default_credits: 3,
    is_active: true
  })

  useEffect(() => {
    loadSemesters()
  }, [])

  const loadSemesters = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/semesters')
      const data = await response.json()
      
      if (data.success !== false) {
        setSemesters(data.data || [])
      } else {
        toast.error(data.error || "Failed to load semesters")
      }
    } catch (error) {
      console.error("Error loading semesters:", error)
      toast.error("Error loading semesters")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      section: "",
      has_midterm: true,
      has_final: true,
      start_date: "",
      end_date: "",
      default_credits: 3,
      is_active: true
    })
    setEditingSemester(null)
  }

  const handleOpenDialog = (semester?: Semester) => {
    if (semester) {
      setEditingSemester(semester)
      setFormData({
        title: semester.title,
        description: semester.description || "",
        section: semester.section,
        has_midterm: semester.has_midterm,
        has_final: semester.has_final,
        start_date: semester.start_date || "",
        end_date: semester.end_date || "",
        default_credits: semester.default_credits || 3,
        is_active: semester.is_active
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingSemester 
        ? `/api/semesters/${editingSemester.id}`
        : '/api/semesters'
      
      const response = await fetch(url, {
        method: editingSemester ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(editingSemester ? "Semester updated successfully" : "Semester created successfully")
        setDialogOpen(false)
        resetForm()
        loadSemesters()
      } else {
        toast.error(data.error || "Failed to save semester")
      }
    } catch (error) {
      console.error("Error saving semester:", error)
      toast.error("Error saving semester")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!semesterToDelete) return

    try {
      const response = await fetch(`/api/semesters/${semesterToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Semester deleted successfully")
        loadSemesters()
      } else {
        toast.error(data.error || "Failed to delete semester")
      }
    } catch (error) {
      console.error("Error deleting semester:", error)
      toast.error("Error deleting semester")
    } finally {
      setDeleteDialogOpen(false)
      setSemesterToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/create/bulk">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Semesters</h1>
              <p className="text-muted-foreground">
                Create and manage your semesters
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadSemesters} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Semester
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingSemester ? 'Edit Semester' : 'Create New Semester'}</DialogTitle>
                <DialogDescription>
                  {editingSemester ? 'Update semester details' : 'Add a new semester to organize your courses'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Spring 2025"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="section">Section *</Label>
                      <Input
                        id="section"
                        placeholder="e.g., 63_G"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the semester"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="default_credits">Default Credits</Label>
                    <Input
                      id="default_credits"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.default_credits}
                      onChange={(e) => setFormData({ ...formData, default_credits: parseInt(e.target.value) || 3 })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Exam Types</Label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="midterm"
                          checked={formData.has_midterm}
                          onCheckedChange={(checked) => setFormData({ ...formData, has_midterm: checked as boolean })}
                        />
                        <Label htmlFor="midterm" className="text-sm">Midterm</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="final"
                          checked={formData.has_final}
                          onCheckedChange={(checked) => setFormData({ ...formData, has_final: checked as boolean })}
                        />
                        <Label htmlFor="final" className="text-sm">Final</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                    />
                    <Label htmlFor="is_active" className="text-sm">Active semester</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingSemester ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingSemester ? 'Update Semester' : 'Create Semester'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Semesters List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Semesters</CardTitle>
          <CardDescription>
            Semesters you have created. Click on a semester to manage its courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : semesters.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No semesters found. Create your first semester to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Exams</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((semester) => (
                  <TableRow key={semester.id}>
                    <TableCell className="font-medium">{semester.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{semester.section}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {semester.has_midterm && (
                          <Badge variant="secondary" className="text-xs">Mid</Badge>
                        )}
                        {semester.has_final && (
                          <Badge variant="secondary" className="text-xs">Final</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={semester.is_active ? "default" : "outline"}>
                        {semester.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(semester.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDialog(semester)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setSemesterToDelete(semester)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Semester</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{semesterToDelete?.title}"? This action cannot be undone.
              All associated courses and content must be deleted first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
