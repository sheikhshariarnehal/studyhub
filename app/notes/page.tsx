"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  AlertCircle,
  Clock,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  BookMarked,
  FolderOpen
} from "lucide-react"
import { ExamNote } from "@/lib/types/notes"
import { cn } from "@/lib/utils"

export default function NotesPage() {
  const [mounted, setMounted] = useState(false)
  const [notes, setNotes] = useState<ExamNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<ExamNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [examTypeFilter, setExamTypeFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Extract unique values for filters
  const semesters = useMemo(() => 
    Array.from(new Set(notes.map((n) => n.semester_title).filter(Boolean))) as string[]
  , [notes])
  
  const examTypes = useMemo(() => 
    Array.from(new Set(notes.map((n) => n.exam_type).filter(Boolean))) as string[]
  , [notes])

  const courses = useMemo(() => 
    Array.from(new Set(notes.map((n) => n.course_code).filter(Boolean))) as string[]
  , [notes])

  // Statistics
  const stats = useMemo(() => ({
    totalNotes: notes.length,
    totalDownloads: notes.reduce((acc, n) => acc + (n.download_count || 0), 0),
    totalCourses: courses.length,
    totalSemesters: semesters.length,
  }), [notes, courses, semesters])

  // Fetch notes from API
  useEffect(() => {
    fetchNotes()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...notes]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.course_title?.toLowerCase().includes(query) ||
          note.course_code?.toLowerCase().includes(query) ||
          note.teacher_name?.toLowerCase().includes(query) ||
          note.description?.toLowerCase().includes(query)
      )
    }

    if (examTypeFilter !== "all") {
      filtered = filtered.filter((note) => note.exam_type === examTypeFilter)
    }

    if (semesterFilter !== "all") {
      filtered = filtered.filter((note) => note.semester_title === semesterFilter)
    }

    if (courseFilter !== "all") {
      filtered = filtered.filter((note) => note.course_code === courseFilter)
    }

    setFilteredNotes(filtered)
  }, [searchQuery, examTypeFilter, semesterFilter, courseFilter, notes])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/notes")
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch notes")
      }

      setNotes(data.data || [])
      setFilteredNotes(data.data || [])
    } catch (err) {
      console.error("Error fetching notes:", err)
      setError(err instanceof Error ? err.message : "Failed to load exam notes")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    } catch {
      return dateString
    }
  }

  const getExamTypeConfig = (examType: string) => {
    switch (examType) {
      case "midterm":
        return { 
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          icon: "📝",
          label: "Midterm"
        }
      case "final":
        return { 
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          icon: "🎯",
          label: "Final"
        }
      case "both":
        return { 
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: "📚",
          label: "Both"
        }
      case "assignment":
        return { 
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: "✍️",
          label: "Assignment"
        }
      case "quiz":
        return { 
          color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: "⚡",
          label: "Quiz"
        }
      default:
        return { 
          color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
          icon: "📄",
          label: examType
        }
    }
  }

  const handleViewNote = (contentUrl: string) => {
    window.open(contentUrl, "_blank", "noopener,noreferrer")
  }

  const handleDownload = async (noteId: string, contentUrl: string) => {
    try {
      await fetch("/api/notes/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId })
      })

      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, download_count: (note.download_count || 0) + 1 } : note
        )
      )
      setFilteredNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, download_count: (note.download_count || 0) + 1 } : note
        )
      )
    } catch (error) {
      console.error("Failed to track download:", error)
    }

    window.open(contentUrl, "_blank", "noopener,noreferrer")
  }

  const clearFilters = () => {
    setSearchQuery("")
    setExamTypeFilter("all")
    setSemesterFilter("all")
    setCourseFilter("all")
  }

  const hasActiveFilters = searchQuery || examTypeFilter !== "all" || semesterFilter !== "all" || courseFilter !== "all"

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Exam Notes
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Access study materials and exam resources
              </p>
            </div>

            {/* Quick Stats */}
            {!loading && !error && notes.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold text-foreground">{stats.totalNotes}</span> notes
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span className="font-semibold text-foreground">{stats.totalDownloads}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BookMarked className="h-4 w-4" />
                  <span className="font-semibold text-foreground">{stats.totalCourses}</span> courses
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-60 shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Filters Card */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-semibold">Filters</CardTitle>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>

                  {/* Exam Type */}
                  <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Exam Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {examTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getExamTypeConfig(type).icon} {getExamTypeConfig(type).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Semester */}
                  <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      {semesters.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Course */}
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            {/* Results Summary */}
            {!loading && !error && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredNotes.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{notes.length}</span> notes
                  </span>
                  {filteredNotes.length !== notes.length && (
                    <Badge variant="outline" className="text-xs rounded-full">
                      Filtered
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* View Toggle */}
                  <div className="flex items-center bg-muted/50 rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 px-3 rounded-md"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 px-3 rounded-md"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className={cn(
                "grid gap-4",
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                  : "grid-cols-1"
              )}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <div className="flex gap-2">
                          <Skeleton className="h-7 w-20 rounded-full" />
                          <Skeleton className="h-7 w-24 rounded-full" />
                        </div>
                        <div className="flex gap-3 pt-3">
                          <Skeleton className="h-10 flex-1 rounded-lg" />
                          <Skeleton className="h-10 flex-1 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-destructive/10 rounded-full">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Failed to load notes</h3>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                  <Button onClick={fetchNotes} variant="outline" className="shrink-0">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notes Grid/List */}
            {!loading && !error && filteredNotes.length > 0 && (
              <div className={cn(
                "grid gap-4 sm:gap-6",
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1"
              )}>
            {filteredNotes.map((note) => {
              const examConfig = getExamTypeConfig(note.exam_type)
              
              return viewMode === "grid" ? (
                // Grid View Card
                <Card 
                  key={note.id} 
                  className="group flex flex-col relative overflow-hidden border bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                >
                  {/* Left accent line */}
                  <div className={cn(
                    "absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-1.5",
                    note.exam_type === "midterm" && "bg-blue-500",
                    note.exam_type === "final" && "bg-purple-500",
                    note.exam_type === "both" && "bg-emerald-500",
                    note.exam_type === "assignment" && "bg-amber-500",
                    note.exam_type === "quiz" && "bg-rose-500",
                    !["midterm", "final", "both", "assignment", "quiz"].includes(note.exam_type) && "bg-slate-500"
                  )} />
                  
                  <CardContent className="flex flex-col flex-1 p-5 pl-7">
                    {/* Header Section */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 h-5 font-medium border-0 bg-opacity-10", examConfig.color)}>
                          {examConfig.label}
                        </Badge>
                        {note.semester_title && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            {note.semester_title}
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-1">
                          {note.title}
                        </h3>
                        {note.course_code && (
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="font-semibold text-foreground/80">{note.course_code}</span>
                            {note.course_title && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                <span className="truncate">{note.course_title}</span>
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Spacer to push footer down */}
                    <div className="flex-1" />

                    {/* Footer Section */}
                    <div className="space-y-4 pt-2">
                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-dashed pt-3">
                        <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                          <Download className="h-3.5 w-3.5" />
                          <span>{note.download_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(note.updated_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="h-9 text-xs font-semibold shadow-sm w-full"
                          onClick={() => handleViewNote(note.content_url)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-xs font-semibold w-full hover:bg-secondary/50"
                          onClick={() => handleDownload(note.id, note.content_url)}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // List View Card
                <Card 
                  key={note.id} 
                  className="group overflow-hidden hover:shadow-sm transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-lg shrink-0", examConfig.color)}>
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {note.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {note.course_code && <span className="font-medium">{note.course_code}</span>}
                          {note.semester_title && <span className="ml-2">{note.semester_title}</span>}
                        </p>
                      </div>

                      <Badge className={cn("text-[10px] px-2 py-0.5 rounded-md shrink-0", examConfig.color)}>
                        {examConfig.label}
                      </Badge>

                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0 hidden sm:flex">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {note.download_count || 0}
                        </span>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleViewNote(note.content_url)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs hidden sm:flex"
                          onClick={() => handleDownload(note.id, note.content_url)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

            {/* Empty State */}
            {!loading && !error && filteredNotes.length === 0 && (
              <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="p-6 bg-muted rounded-full mb-6">
                    <FolderOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No notes found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                    {notes.length === 0
                      ? "No exam notes are available yet. Check back later for study materials!"
                      : "No notes match your current filters. Try adjusting your search criteria."}
                  </p>
                  {hasActiveFilters && (
                    <Button 
                      variant="outline"
                      onClick={clearFilters}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear all filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
