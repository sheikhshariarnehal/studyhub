"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"

interface Semester {
  id: string
  title: string
  section: string
}

interface Course {
  id: string
  title: string
  course_code: string
  teacher_name?: string
  semester_id?: string
  semester?: Semester
}

interface Resource {
  id: string
  title: string
  description: string | null
  type: string
  content_url: string | null
  course_id: string | null
  course_name: string | null
  semester_id: string | null
  semester_name: string | null
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

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  type: z.enum([
    "previous_questions",
    "exam_note",
    "syllabus",
    "mark_distribution",
    "assignment",
    "lab_manual",
    "reference_book"
  ]),
  content_url: z.string().url("Please enter a valid URL").or(z.literal("")),
  // Course can be selected or manually entered
  course_id: z.string().optional(),
  course_name: z.string().max(255).optional(),
  // Semester can be selected or manually entered
  semester_id: z.string().optional(),
  semester_name: z.string().max(255).optional(),
  exam_type: z.enum(["midterm", "final", "both", "assignment", "quiz"]).optional().nullable(),
  file_size_mb: z.coerce.number().min(0).max(1000).optional().nullable(),
  file_format: z.string().max(50).optional().nullable(),
  academic_year: z.string().max(20).optional().nullable(),
  is_downloadable: z.boolean().default(true)
})

type ResourceFormValues = z.infer<typeof resourceSchema>

interface ResourceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: Resource | null
  defaultType?: string
  onSuccess: () => void
}

const resourceTypeOptions = [
  { value: "previous_questions", label: "Previous Questions" },
  { value: "exam_note", label: "Exam Notes" },
  { value: "syllabus", label: "Syllabus" },
  { value: "mark_distribution", label: "Mark Distribution" },
  { value: "assignment", label: "Assignment" },
  { value: "lab_manual", label: "Lab Manual" },
  { value: "reference_book", label: "Reference Book" }
]

const examTypeOptions = [
  { value: "midterm", label: "Midterm" },
  { value: "final", label: "Final" },
  { value: "both", label: "Both" },
  { value: "assignment", label: "Assignment" },
  { value: "quiz", label: "Quiz" }
]

const fileFormatOptions = [
  "PDF",
  "DOCX",
  "DOC",
  "PPTX",
  "PPT",
  "XLSX",
  "XLS",
  "TXT",
  "ZIP",
  "JPG",
  "PNG"
]

export function ResourceFormDialog({
  open,
  onOpenChange,
  resource,
  defaultType,
  onSuccess
}: ResourceFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  
  // Toggle state for manual course input
  const [useManualCourse, setUseManualCourse] = useState(false)

  const isEditing = !!resource

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      type: defaultType as ResourceFormValues["type"] || "previous_questions",
      content_url: "",
      course_id: "",
      course_name: "",
      semester_id: "",
      semester_name: "",
      exam_type: null,
      file_size_mb: null,
      file_format: null,
      academic_year: null,
      is_downloadable: true
    }
  })

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true)
      try {
        const response = await fetch("/api/courses")
        const data = await response.json()
        if (data.courses) {
          setCourses(data.courses)
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error)
      } finally {
        setLoadingCourses(false)
      }
    }

    if (open) {
      fetchCourses()
    }
  }, [open])

  // Reset form when resource changes or dialog opens
  useEffect(() => {
    if (open) {
      if (resource) {
        // Determine if we should use manual mode based on existing data
        const hasManualCourse = resource.course_name && !resource.course_id
        
        setUseManualCourse(hasManualCourse || false)
        
        form.reset({
          title: resource.title,
          description: resource.description || "",
          type: resource.type as ResourceFormValues["type"],
          content_url: resource.content_url || "",
          course_id: resource.course_id || "",
          course_name: resource.course_name || resource.course?.title || "",
          semester_id: resource.semester_id || resource.course?.semester_id || "",
          semester_name: resource.semester_name || resource.course?.semester?.title || "",
          exam_type: resource.exam_type as ResourceFormValues["exam_type"] || null,
          file_size_mb: resource.file_size_mb || null,
          file_format: resource.file_format || null,
          academic_year: resource.academic_year || null,
          is_downloadable: resource.is_downloadable ?? true
        })
      } else {
        setUseManualCourse(false)
        form.reset({
          title: "",
          description: "",
          type: defaultType as ResourceFormValues["type"] || "previous_questions",
          content_url: "",
          course_id: "",
          course_name: "",
          semester_id: "",
          semester_name: "",
          exam_type: null,
          file_size_mb: null,
          file_format: null,
          academic_year: null,
          is_downloadable: true
        })
      }
    }
  }, [resource, open, form, defaultType])

  // Clear course selection when toggling modes
  const handleCourseToggle = (manual: boolean) => {
    setUseManualCourse(manual)
    if (manual) {
      form.setValue("course_id", "")
    } else {
      form.setValue("course_name", "")
    }
  }

  const onSubmit = async (values: ResourceFormValues) => {
    setLoading(true)
    try {
      const url = isEditing 
        ? `/api/admin/resources/${resource.id}`
        : "/api/admin/resources"
      
      const method = isEditing ? "PUT" : "POST"

      // Clean up values based on mode
      const cleanedValues = {
        ...values,
        description: values.description || null,
        content_url: values.content_url || null,
        // If manual mode, use course_name and clear course_id
        course_id: useManualCourse ? null : (values.course_id || null),
        course_name: useManualCourse ? (values.course_name || null) : null,
        // Always use semester_name from checkbox selection
        semester_id: null,
        semester_name: values.semester_name || null,
        exam_type: values.exam_type || null,
        file_format: values.file_format || null,
        academic_year: values.academic_year || null
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cleanedValues)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: isEditing 
            ? "Resource updated successfully"
            : "Resource created successfully"
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to save resource:", error)
      toast({
        title: "Error",
        description: "Failed to save resource",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Resource" : "Create New Resource"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the resource details below"
              : "Fill in the details to create a new resource"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spring 2023 Final Exam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the resource..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resourceTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Semester Selection - Checkbox style */}
              <div className="space-y-3 md:col-span-2">
                <Label className="text-sm font-medium">Semester</Label>
                <FormField
                  control={form.control}
                  name="semester_name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-3">
                        {["Fall", "Summer", "Spring"].map((season) => {
                          const currentYear = new Date().getFullYear()
                          const shortYear = currentYear % 100
                          const semesterValue = `${season} ${shortYear}`
                          const isSelected = field.value === semesterValue
                          
                          return (
                            <label
                              key={season}
                              className="flex items-center gap-2.5 px-4 py-3 rounded-md border border-input bg-background hover:bg-accent hover:border-accent-foreground/20 cursor-pointer transition-all duration-200"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? semesterValue : "")
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-sm font-medium select-none">{season}</span>
                            </label>
                          )
                        })}
                      </div>
                      <FormDescription className="text-xs mt-2">
                        Select a semester or leave empty
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Course Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Course</Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${!useManualCourse ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      Select
                    </span>
                    <Switch
                      checked={useManualCourse}
                      onCheckedChange={handleCourseToggle}
                    />
                    <span className={`text-xs ${useManualCourse ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      Manual
                    </span>
                  </div>
                </div>
                
                {useManualCourse ? (
                  <FormField
                    control={form.control}
                    name="course_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="e.g., CSE 101 - Introduction to Programming"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Enter course name manually
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="course_id"
                    render={({ field }) => (
                      <FormItem>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "_none" ? "" : value)} 
                          value={field.value || "_none"}
                          disabled={loadingCourses}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingCourses ? "Loading..." : "Select course"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_none">No Course</SelectItem>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.course_code} - {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Content URL */}
              <FormField
                control={form.control}
                name="content_url"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Content URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://drive.google.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Google Drive, Dropbox, or direct file URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Exam Type */}
              <FormField
                control={form.control}
                name="exam_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Type</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "_none" ? null : value)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">None</SelectItem>
                        {examTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Academic Year */}
              <FormField
                control={form.control}
                name="academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 2023-24"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Format */}
              <FormField
                control={form.control}
                name="file_format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Format</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "_none" ? null : value)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Not specified</SelectItem>
                        {fileFormatOptions.map((format) => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Size */}
              <FormField
                control={form.control}
                name="file_size_mb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Size (MB)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.1"
                        placeholder="e.g., 2.5"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Downloadable */}
              <FormField
                control={form.control}
                name="is_downloadable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 md:col-span-2 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Allow Downloads
                      </FormLabel>
                      <FormDescription>
                        Users can download this resource
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Update Resource" : "Create Resource"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
