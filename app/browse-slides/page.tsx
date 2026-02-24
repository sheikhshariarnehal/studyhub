"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { generateSimpleShareUrl } from "@/lib/simple-share-utils"
import { FileText, Search, Copy, Check, ExternalLink, FolderOpen, X, RefreshCw, AlertCircle } from "lucide-react"

interface Slide {
  id: string
  title: string
  google_drive_url: string
  description?: string
  topic?: {
    id: string
    title: string
    course?: {
      id: string
      title: string
    }
  }
}

function SlideCardSkeleton() {
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

export default function BrowseSlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchSlides = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/slides-list')
      const data = await response.json()
      if (response.ok) {
        setSlides(data.slides || [])
      } else {
        setError(data.error || 'Failed to fetch slides')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSlides() }, [fetchSlides])

  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return slides
    const q = searchQuery.toLowerCase()
    return slides.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.topic?.title.toLowerCase().includes(q) ||
      s.topic?.course?.title.toLowerCase().includes(q)
    )
  }, [slides, searchQuery])

  const openSlide = (id: string) => window.open(generateSimpleShareUrl('slide', id), '_blank')

  const copyShareUrl = async (id: string) => {
    try {
      await navigator.clipboard.writeText(generateSimpleShareUrl('slide', id))
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
              <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="h-5 w-5 text-blue-500" /></div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Browse Slides</h1>
            </div>
            <p className="text-sm text-muted-foreground">Access course slide presentations</p>
          </div>
          {!loading && !error && (
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{slides.length}</span> slides available
            </span>
          )}
        </div>

        {/* Search */}
        {!loading && !error && slides.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search slides..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-10" />
              {hasActiveSearch && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {hasActiveSearch && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing <span className="font-semibold text-foreground">{filteredSlides.length}</span> of <span className="font-semibold text-foreground">{slides.length}</span> slides
              </p>
            )}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SlideCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-destructive/10 rounded-full"><AlertCircle className="h-6 w-6 text-destructive" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Failed to load slides</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={fetchSlides} variant="outline" className="shrink-0"><RefreshCw className="h-4 w-4 mr-2" />Try again</Button>
            </CardContent>
          </Card>
        )}

        {/* Empty — no data */}
        {!loading && !error && slides.length === 0 && (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-6 bg-muted rounded-full mb-6"><FolderOpen className="h-12 w-12 text-muted-foreground" /></div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No slides available</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">No slide content has been added yet. Check back later!</p>
              <Button variant="outline" onClick={() => window.location.href = '/'}>Back to Main Page</Button>
            </CardContent>
          </Card>
        )}

        {/* Empty — no search results */}
        {!loading && !error && slides.length > 0 && filteredSlides.length === 0 && (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-6 bg-muted rounded-full mb-6"><Search className="h-12 w-12 text-muted-foreground" /></div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">No slides match &quot;{searchQuery}&quot;. Try a different search term.</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}><X className="h-4 w-4 mr-2" />Clear search</Button>
            </CardContent>
          </Card>
        )}

        {/* Slide Cards */}
        {!loading && !error && filteredSlides.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSlides.map(slide => (
              <Card key={slide.id} className="group overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><FileText className="h-5 w-5 text-blue-500" /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{slide.title}</h3>
                      {slide.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{slide.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {slide.topic && <Badge variant="secondary" className="text-[10px] rounded-full truncate max-w-[160px]">{slide.topic.title}</Badge>}
                    {slide.topic?.course && <Badge variant="secondary" className="text-[10px] rounded-full truncate max-w-[160px]">{slide.topic.course.title}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="h-9 text-xs font-semibold" onClick={() => openSlide(slide.id)}>
                      <ExternalLink className="h-3 w-3 mr-1.5" />Open
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 text-xs font-semibold" onClick={() => copyShareUrl(slide.id)}>
                      {copiedId === slide.id ? <><Check className="h-3 w-3 mr-1.5 text-green-500" />Copied!</> : <><Copy className="h-3 w-3 mr-1.5" />Share</>}
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
