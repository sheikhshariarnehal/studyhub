"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  BookOpen,
  ArrowLeft,
  Star
} from "lucide-react"
import Link from "next/link"

interface Semester {
  id: string
  title: string
  section: string | null
}

interface Course {
  id: string
  title: string
  course_code: string
  teacher_name: string
  teacher_email: string | null
  description: string | null
  credits: number
  semester_id: string
  is_active: boolean
  is_highlighted: boolean
  created_at: string
  semester?: Semester
}

export default function DashboardCoursePage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    course_code: "",
    teacher_name: "",
    teacher_email: "",
    description: "",
    credits: 3,
    semester_id: "",
    is_active: true,
    is_highlighted: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load semesters first
      const semestersRes = await fetch('/api/semesters')
      const semestersData = await semestersRes.json()
      
      if (semestersData.data) {
        setSemesters(semestersData.data)
      }

      // Load courses
      const coursesRes = await fetch('/api/courses')
      const coursesData = await coursesRes.json()
      
      if (coursesData.success !== false) {
        setCourses(coursesData.courses || [])
      } else {
        toast.error(coursesData.error || "Failed to load courses")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Error loading data")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      course_code: "",
      teacher_name: "",
      teacher_email: "",
      description: "",
      credits: 3,
      semester_id: "",
      is_active: true,
      is_highlighted: false
    })
    setEditingCourse(null)
  }

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        title: course.title,
        course_code: course.course_code,
        teacher_name: course.teacher_name,
        teacher_email: course.teacher_email || "",
        description: course.description || "",
        credits: course.credits || 3,
        semester_id: course.semester_id,
        is_active: course.is_active,
        is_highlighted: course.is_highlighted
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.semester_id) {
      toast.error("Please select a semester")
      return
    }

    setIsSubmitting(true)

    try {
      let url: string
      let method: string

      if (editingCourse) {
        url = `/api/courses/${editingCourse.id}`
        method = 'PUT'
      } else {
        url = `/api/semesters/${formData.semester_id}/courses`
        method = 'POST'
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacher_email: formData.teacher_email || null,
          description: formData.description || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(editingCourse ? "Course updated successfully" : "Course created successfully")
        setDialogOpen(false)
        resetForm()
        loadData()
      } else {
        toast.error(data.error || "Failed to save course")
      }
    } catch (error) {
      console.error("Error saving course:", error)
      toast.error("Error saving course")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!courseToDelete) return

    try {
      const response = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Course deleted successfully")
        loadData()
      } else {
        toast.error(data.error || "Failed to delete course")
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Error deleting course")
    } finally {
      setDeleteDialogOpen(false)
      setCourseToDelete(null)
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
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
              <p className="text-muted-foreground">
                Create and manage your courses
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} disabled={semesters.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                <DialogDescription>
                  {editingCourse ? 'Update course details' : 'Add a new course to a semester'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="semester">Semester *</Label>
                    <Select
                      value={formData.semester_id}
                      onValueChange={(value) => setFormData({ ...formData, semester_id: value })}
                      disabled={!!editingCourse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester.id} value={semester.id}>
                            {semester.title} {semester.section && `(${semester.section})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Course Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Internet of Things"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="course_code">Course Code *</Label>
                      <Input
                        id="course_code"
                        placeholder="e.g., CSE 422"
                        value={formData.course_code}
                        onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="teacher_name">Teacher Name *</Label>
                      <Input
                        id="teacher_name"
                        placeholder="e.g., Dr. Ahmed Rahman"
                        value={formData.teacher_name}
                        onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="teacher_email">Teacher Email</Label>
                      <Input
                        id="teacher_email"
                        type="email"
                        placeholder="teacher@diu.edu.bd"
                        value={formData.teacher_email}
                        onChange={(e) => setFormData({ ...formData, teacher_email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the course"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                      />
                      <Label htmlFor="is_active" className="text-sm">Active course</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_highlighted"
                        checked={formData.is_highlighted}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_highlighted: checked as boolean })}
                      />
                      <Label htmlFor="is_highlighted" className="text-sm">Highlight this course</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !formData.semester_id}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingCourse ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingCourse ? 'Update Course' : 'Create Course'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info if no semesters */}
      {!isLoading && semesters.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              You need to create a semester first before adding courses.{" "}
              <Link href="/dashboard/create/semester" className="underline font-medium">
                Create a semester
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
          <CardDescription>
            Courses you have created across all your semesters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No courses found. Create your first course to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} className={course.is_highlighted ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {course.title}
                        {course.is_highlighted && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.course_code}</Badge>
                    </TableCell>
                    <TableCell>{course.teacher_name}</TableCell>
                    <TableCell>
                      {course.semester ? (
                        <Badge variant="secondary">
                          {course.semester.title} {course.semester.section && `(${course.semester.section})`}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>
                      <Badge variant={course.is_active ? "default" : "outline"}>
                        {course.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDialog(course)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setCourseToDelete(course)
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
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone.
              All associated topics and content must be deleted first.
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
