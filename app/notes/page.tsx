"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Eye, Search, Filter, BookOpen, Calendar, ExternalLink, AlertCircle } from "lucide-react"
import { ExamNote } from "@/lib/types/notes"

export default function NotesPage() {
  const [mounted, setMounted] = useState(false)
  const [notes, setNotes] = useState<ExamNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<ExamNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [examTypeFilter, setExamTypeFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Extract unique values for filters
  const semesters = Array.from(new Set(notes.map((n) => n.semester_title).filter(Boolean))) as string[]
  const examTypes = Array.from(new Set(notes.map((n) => n.exam_type).filter(Boolean))) as string[]

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

    setFilteredNotes(filtered)
  }, [searchQuery, examTypeFilter, semesterFilter, notes])

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

  const getExamTypeBadgeColor = (examType: string) => {
    switch (examType) {
      case "midterm":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      case "final":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
      case "both":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      case "assignment":
        return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
      case "quiz":
        return "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    }
  }

  const handleViewNote = (contentUrl: string) => {
    window.open(contentUrl, "_blank", "noopener,noreferrer")
  }

  const handleDownload = async (noteId: string, contentUrl: string) => {
    // Track download count in the background
    try {
      await fetch("/api/notes/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ noteId })
      })

      // Update local state optimistically
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
      // Continue with download even if tracking fails
    }

    // Open the file for download/view
    window.open(contentUrl, "_blank", "noopener,noreferrer")
  }

  const clearFilters = () => {
    setSearchQuery("")
    setExamTypeFilter("all")
    setSemesterFilter("all")
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Exam Notes
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Access comprehensive study materials for all your courses
          </p>
        </div>

        {/* Filters Section */}
        <Card className="mb-6 border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Filter & Search</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search notes, courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              {/* Exam Type Filter */}
              <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="All Exam Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exam Types</SelectItem>
                  {examTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Semester Filter */}
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="All Semesters" />
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
            </div>

            {/* Active Filters Display */}
            {(searchQuery || examTypeFilter !== "all" || semesterFilter !== "all") && (
              <div className="flex items-center gap-2 pt-3 border-t flex-wrap">
                <span className="text-xs text-muted-foreground">Active:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs px-2.5 py-1">
                    {searchQuery}
                  </Badge>
                )}
                {examTypeFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs px-2.5 py-1">
                    {examTypeFilter}
                  </Badge>
                )}
                {semesterFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs px-2.5 py-1">
                    {semesterFilter}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs ml-auto px-3"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {!loading && !error && (
          <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing <span className="font-semibold text-foreground">{filteredNotes.length}</span> of{" "}
              <span className="font-semibold text-foreground">{notes.length}</span> notes
            </span>
            {filteredNotes.length !== notes.length && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Filtered
              </Badge>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="px-3 py-2.5 bg-muted/30 rounded-lg">
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div className="pt-3 border-t">
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <div className="pt-3.5 flex gap-2.5">
                    <Skeleton className="h-9 flex-1 rounded-md" />
                    <Skeleton className="h-9 flex-1 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotes}
                className="ml-4"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Notes Grid */}
        {!loading && !error && filteredNotes.length > 0 && (
          <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card 
                key={note.id} 
                className="group relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="pb-4 space-y-2 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <CardTitle className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                        {note.title}
                      </CardTitle>
                      {note.description && (
                        <CardDescription className="text-xs leading-relaxed line-clamp-2">
                          {note.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10 space-y-3.5">
                  {/* Course Info Section */}
                  {note.course_code && note.course_title && (
                    <div className="px-3 py-2.5 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 text-xs">
                        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">{note.course_code}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground line-clamp-1 flex-1">{note.course_title}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Badges Section */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getExamTypeBadgeColor(note.exam_type)} text-xs px-2.5 py-1`}>
                      {note.exam_type.charAt(0).toUpperCase() + note.exam_type.slice(1)}
                    </Badge>
                    {note.semester_title && (
                      <Badge variant="outline" className="gap-1 text-xs px-2.5 py-1">
                        <Calendar className="h-3 w-3" />
                        {note.semester_title}
                      </Badge>
                    )}
                    {note.section && (
                      <Badge variant="secondary" className="text-xs px-2.5 py-1">
                        {note.section}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Stats Section - Downloads & Date side by side */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      <span>{note.download_count || 0}</span>
                    </div>
                    <span>Updated {formatDate(note.updated_at)}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="pt-3.5 flex gap-2.5">
                    <Button
                      size="default"
                      className="flex-1 group/btn relative overflow-hidden text-sm font-medium h-9"
                      onClick={() => handleViewNote(note.content_url)}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      <span>View</span>
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      className="flex-1 group/download text-sm font-medium h-9"
                      onClick={() => handleDownload(note.id, note.content_url)}
                    >
                      <Download className="h-4 w-4 mr-1.5 group-hover/download:translate-y-0.5 transition-transform duration-300" />
                      <span>Download</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredNotes.length === 0 && (
          <Card className="text-center py-12 border-dashed">
            <CardContent>
              <div className="flex flex-col items-center gap-5">
                <div className="p-5 bg-muted rounded-2xl">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-3 max-w-md">
                  <h3 className="text-lg font-semibold text-foreground">No exam notes found</h3>
                  <p className="text-sm text-muted-foreground">
                    {notes.length === 0
                      ? "No exam notes are available yet. Check back later!"
                      : "Try adjusting your filters or search query."}
                  </p>
                  {notes.length > 0 && (
                    <div className="pt-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        {!loading && !error && notes.length > 0 && (
          <div className="mt-10">
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap text-sm text-muted-foreground">
                  <span>{notes.length} Total Notes</span>
                  <span>•</span>
                  <span>{semesters.length} Semesters</span>
                  <span>•</span>
                  <span>{Array.from(new Set(notes.map((n) => n.course_code).filter(Boolean))).length} Courses</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
