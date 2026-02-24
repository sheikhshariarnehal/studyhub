"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { generateSimpleShareUrl } from "@/lib/simple-share-utils"
import { BookOpen, Search, Copy, Check, ExternalLink, FolderOpen, X, RefreshCw, AlertCircle } from "lucide-react"

interface StudyTool {
  id: string
  title: string
  google_drive_url: string
  description?: string
  study_tool_type: string
  topic?: {
    id: string
    title: string
    course?: {
      id: string
      title: string
    }
  }
}

function StudyToolCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function BrowseStudyToolsPage() {
  const [studyTools, setStudyTools] = useState<StudyTool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchStudyTools = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/study-tools-list')
      const data = await response.json()
      if (response.ok) {
        setStudyTools(data.studyTools || [])
      } else {
        setError(data.error || 'Failed to fetch study tools')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStudyTools() }, [fetchStudyTools])

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return studyTools
    const q = searchQuery.toLowerCase()
    return studyTools.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.study_tool_type.toLowerCase().includes(q) ||
      t.topic?.title.toLowerCase().includes(q) ||
      t.topic?.course?.title.toLowerCase().includes(q)
    )
  }, [studyTools, searchQuery])

  const openTool = (id: string) => window.open(generateSimpleShareUrl('study-tool', id), '_blank')

  const copyShareUrl = async (id: string) => {
    try {
      await navigator.clipboard.writeText(generateSimpleShareUrl('study-tool', id))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const hasActiveSearch = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><BookOpen className="h-5 w-5 text-emerald-500" /></div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Browse Study Tools</h1>
            </div>
            <p className="text-sm text-muted-foreground">Access study resources, syllabi, and lab manuals</p>
          </div>
          {!loading && !error && (
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{studyTools.length}</span> study tools available
            </span>
          )}
        </div>

        {/* Search */}
        {!loading && !error && studyTools.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search study tools..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-10" />
              {hasActiveSearch && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {hasActiveSearch && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing <span className="font-semibold text-foreground">{filteredTools.length}</span> of <span className="font-semibold text-foreground">{studyTools.length}</span> study tools
              </p>
            )}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <StudyToolCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-destructive/10 rounded-full"><AlertCircle className="h-6 w-6 text-destructive" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Failed to load study tools</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={fetchStudyTools} variant="outline" className="shrink-0"><RefreshCw className="h-4 w-4 mr-2" />Try again</Button>
            </CardContent>
          </Card>
        )}

        {/* Empty — no data */}
        {!loading && !error && studyTools.length === 0 && (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-6 bg-muted rounded-full mb-6"><FolderOpen className="h-12 w-12 text-muted-foreground" /></div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No study tools available</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">No study tools have been added yet. Check back later!</p>
              <Button variant="outline" onClick={() => window.location.href = '/'}>Back to Main Page</Button>
            </CardContent>
          </Card>
        )}

        {/* Empty — no search results */}
        {!loading && !error && studyTools.length > 0 && filteredTools.length === 0 && (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-6 bg-muted rounded-full mb-6"><Search className="h-12 w-12 text-muted-foreground" /></div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">No study tools match &quot;{searchQuery}&quot;. Try a different search term.</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}><X className="h-4 w-4 mr-2" />Clear search</Button>
            </CardContent>
          </Card>
        )}

        {/* Study Tool Cards */}
        {!loading && !error && filteredTools.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map(tool => (
              <Card key={tool.id} className="group overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0"><BookOpen className="h-5 w-5 text-emerald-500" /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{tool.title}</h3>
                      {tool.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <Badge variant="outline" className="text-[10px] rounded-full capitalize">{tool.study_tool_type}</Badge>
                    {tool.topic && <Badge variant="secondary" className="text-[10px] rounded-full truncate max-w-[160px]">{tool.topic.title}</Badge>}
                    {tool.topic?.course && <Badge variant="secondary" className="text-[10px] rounded-full truncate max-w-[160px]">{tool.topic.course.title}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="h-9 text-xs font-semibold" onClick={() => openTool(tool.id)}>
                      <ExternalLink className="h-3 w-3 mr-1.5" />Open
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 text-xs font-semibold" onClick={() => copyShareUrl(tool.id)}>
                      {copiedId === tool.id ? <><Check className="h-3 w-3 mr-1.5 text-green-500" />Copied!</> : <><Copy className="h-3 w-3 mr-1.5" />Share</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button onClick={() => window.location.href = '/'} variant="outline">Back to Main Page</Button>
        </div>
      </main>
    </div>
  )
}
