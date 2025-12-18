"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Eye,
  Calendar,
  BookOpen,
  Loader2,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Power,
  PowerOff,
  FileText,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface SemesterSummary {
  id: string
  title: string
  description: string
  section: string
  has_midterm: boolean
  has_final: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  courses_count: number
  topics_count: number
  materials_count: number
  study_tools_count: number
}

type SortField = 'title' | 'section' | 'created_at' | 'updated_at' | 'courses_count'
type SortOrder = 'asc' | 'desc'

export default function DashboardBulkCreatorPage() {
  const router = useRouter()
  const [semesters, setSemesters] = useState<SemesterSummary[]>([])
  const [filteredSemesters, setFilteredSemesters] = useState<SemesterSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadSemesters()
  }, [])

  useEffect(() => {
    filterAndSortSemesters()
  }, [semesters, searchQuery, sortField, sortOrder, statusFilter])

  const loadSemesters = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/semesters/summary')
      
      if (response.ok) {
        const data = await response.json()
        setSemesters(data.semesters || [])
        toast.success(`Loaded ${data.semesters?.length || 0} semesters`)
      } else {
        toast.error("Failed to load semesters")
      }
    } catch (error) {
      console.error("Error loading semesters:", error)
      toast.error("Error loading semesters")
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortSemesters = () => {
    let filtered = [...semesters]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => 
        statusFilter === 'active' ? s.is_active : !s.is_active
      )
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.section.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'section':
          comparison = a.section.localeCompare(b.section)
          break
        case 'courses_count':
          comparison = a.courses_count - b.courses_count
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredSemesters(filtered)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/semesters/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        toast.success(currentStatus ? "Semester deactivated" : "Semester activated")
        loadSemesters()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/semesters/${id}/duplicate`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success("Semester duplicated successfully")
        loadSemesters()
      } else {
        toast.error("Failed to duplicate semester")
      }
    } catch (error) {
      toast.error("Error duplicating semester")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/semesters/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Semester deleted successfully")
        loadSemesters()
      } else {
        toast.error("Failed to delete semester")
      }
    } catch (error) {
      toast.error("Error deleting semester")
    }
  }

  const stats = {
    total: semesters.length,
    active: semesters.filter(s => s.is_active).length,
    inactive: semesters.filter(s => !s.is_active).length,
    totalCourses: semesters.reduce((sum, s) => sum + s.courses_count, 0)
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Semester Creator</h1>
          <p className="text-muted-foreground">
            Create and manage semesters with courses, topics, and study materials
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-col gap-5 mb-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground truncate">Total Semesters</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground truncate">Active</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{stats.active}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground truncate">Inactive</p>
                  <p className="text-2xl font-bold mt-1 text-orange-600">{stats.inactive}</p>
                </div>
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground truncate">Total Courses</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{stats.totalCourses}</p>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, section, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
                className="flex-1 sm:flex-none h-10"
              >
                All ({stats.total})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
                size="sm"
                className="flex-1 sm:flex-none h-10"
              >
                <Power className="h-4 w-4 mr-1" />
                Active ({stats.active})
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('inactive')}
                size="sm"
                className="flex-1 sm:flex-none h-10"
              >
                <PowerOff className="h-4 w-4 mr-1" />
                Inactive ({stats.inactive})
              </Button>
              <Button
                onClick={() => router.push('/dashboard/create/bulk/new')}
                size="sm"
                className="flex-1 sm:flex-none h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Create New Semester</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semesters Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Semesters List</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadSemesters} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge variant="outline" className="text-sm">
                {filteredSemesters.length} result{filteredSemesters.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Manage all your semester data including courses, topics, and study materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredSemesters.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No semesters found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "Get started by creating your first semester"}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button
                  onClick={() => router.push('/dashboard/create/bulk/new')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Semester
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold min-w-[250px]">Semester Info</TableHead>
                    <TableHead className="font-semibold min-w-[100px]">Section</TableHead>
                    <TableHead className="font-semibold text-center min-w-[200px]">Content</TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">Status</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">Last Updated</TableHead>
                    <TableHead className="text-right font-semibold min-w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSemesters.map((semester) => (
                    <TableRow 
                      key={semester.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-base">{semester.title}</span>
                          {semester.description && (
                            <span className="text-sm text-muted-foreground line-clamp-1">
                              {semester.description}
                            </span>
                          )}
                          <div className="flex gap-2 mt-1">
                            {semester.has_midterm && (
                              <Badge variant="secondary" className="text-xs">
                                Midterm
                              </Badge>
                            )}
                            {semester.has_final && (
                              <Badge variant="secondary" className="text-xs">
                                Final
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-sm">
                          {semester.section}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 items-center">
                          <div className="flex gap-3 text-sm">
                            <div className="flex items-center gap-1 text-blue-600">
                              <BookOpen className="h-4 w-4" />
                              <span className="font-semibold">{semester.courses_count}</span>
                              <span className="text-muted-foreground">courses</span>
                            </div>
                            <div className="flex items-center gap-1 text-purple-600">
                              <FileText className="h-4 w-4" />
                              <span className="font-semibold">{semester.topics_count}</span>
                              <span className="text-muted-foreground">topics</span>
                            </div>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{semester.materials_count} materials</span>
                            <span>{semester.study_tools_count} tools</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(semester.id, semester.is_active)}
                          className="h-8 w-8 p-0"
                        >
                          {semester.is_active ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-orange-600" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(semester.updated_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/create/bulk/edit?id=${semester.id}`)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(semester.id)}
                            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600"
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Semester?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{semester.title}" and all associated courses, topics, and materials. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(semester.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
