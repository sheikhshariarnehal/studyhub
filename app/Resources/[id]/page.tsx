"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  Share2, 
  BookOpen, 
  Calendar, 
  FileText,
  BookMarked,
  GraduationCap,
  Clock,
  Eye,
  User,
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Copy,
  Check,
  FileQuestion,
  ClipboardList,
  FlaskConical,
  Library
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Type definitions
interface Course {
  id: string
  title: string
  course_code: string
  teacher_name?: string
  description?: string
  credits?: number
  semester?: {
    id: string
    title: string
    section: string
  }
}

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
  semester_name: string | null
  is_downloadable: boolean
  download_count: number
  view_count: number
  created_at: string
  updated_at: string
  course: Course | null
}

// Resource type configuration
const resourceTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  previous_questions: { 
    icon: FileQuestion, 
    label: "Previous Questions", 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30"
  },
  exam_note: { 
    icon: BookOpen, 
    label: "Exam Notes", 
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30"
  },
  syllabus: { 
    icon: ClipboardList, 
    label: "Syllabus", 
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30"
  },
  mark_distribution: { 
    icon: GraduationCap, 
    label: "Mark Distribution", 
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30"
  },
  assignment: { 
    icon: FileText, 
    label: "Assignment", 
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30"
  },
  lab_manual: { 
    icon: FlaskConical, 
    label: "Lab Manual", 
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30"
  },
  reference_book: { 
    icon: Library, 
    label: "Reference Book", 
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30"
  }
}

const examTypeLabels: Record<string, string> = {
  midterm: "Midterm",
  final: "Final",
  both: "Both",
  assignment: "Assignment",
  quiz: "Quiz"
}

// Helper function to convert Google Drive URL to embed URL
function getGoogleDriveEmbedUrl(url: string | null): string | null {
  if (!url) return null
  
  // Extract file ID from various Google Drive URL formats
  let fileId: string | null = null
  
  // Format: https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    fileId = fileMatch[1]
  }
  
  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    fileId = openMatch[1]
  }
  
  // Format: https://docs.google.com/document/d/FILE_ID/edit
  const docsMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (docsMatch) {
    fileId = docsMatch[1]
  }
  
  // Format: https://docs.google.com/presentation/d/FILE_ID/edit
  const presentationMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)
  if (presentationMatch) {
    fileId = presentationMatch[1]
  }
  
  // Format: https://docs.google.com/spreadsheets/d/FILE_ID/edit
  const sheetsMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (sheetsMatch) {
    fileId = sheetsMatch[1]
  }
  
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`
  }
  
  // For direct file URLs (e.g. DigitalOcean Spaces, S3, CDN-hosted PDFs),
  // use Google Docs Viewer so Chrome does not block the iframe embed.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  }
  
  return url
}

// Helper function to get download URL
function getGoogleDriveDownloadUrl(url: string | null): string | null {
  if (!url) return null
  
  let fileId: string | null = null
  
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    fileId = fileMatch[1]
  }
  
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    fileId = openMatch[1]
  }
  
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`
  }
  
  return url
}

export default function ResourceViewPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const resourceId = params.id as string

  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [downloadCount, setDownloadCount] = useState(0)
  const hasTrackedView = React.useRef(false)

  // Track view or download action
  const trackAction = useCallback(async (action: 'view' | 'download') => {
    try {
      const response = await fetch(`/api/resources/${resourceId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await response.json()
      if (data.success) {
        setViewCount(data.view_count || 0)
        setDownloadCount(data.download_count || 0)
      }
    } catch (err) {
      console.error(`Failed to track ${action}:`, err)
    }
  }, [resourceId])

  // Fetch resource
  const fetchResource = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/resources/${resourceId}`)
      const data = await response.json()

      if (data.success) {
        setResource(data.resource)
        setViewCount(data.resource.view_count || 0)
        setDownloadCount(data.resource.download_count || 0)
      } else {
        setError(data.error || "Failed to fetch resource")
      }
    } catch (err) {
      setError("Failed to load resource")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [resourceId])

  useEffect(() => {
    if (resourceId) {
      fetchResource()
    }
  }, [resourceId, fetchResource])

  // Track view once when resource is loaded
  useEffect(() => {
    if (resource && !hasTrackedView.current) {
      hasTrackedView.current = true
      trackAction('view')
    }
  }, [resource, trackAction])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  // Copy link
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "The resource link has been copied to your clipboard."
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually from the address bar.",
        variant: "destructive"
      })
    }
  }

  // Share
  const handleShare = async () => {
    if (navigator.share && resource) {
      try {
        await navigator.share({
          title: resource.title,
          text: `Check out this study resource: ${resource.title}`,
          url: window.location.href
        })
      } catch (err) {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  // Open in new tab
  const openInNewTab = () => {
    if (resource?.content_url) {
      window.open(resource.content_url, "_blank")
    }
  }

  // Download
  const handleDownload = async () => {
    if (resource?.content_url) {
      // Track download
      await trackAction('download')
      
      const downloadUrl = getGoogleDriveDownloadUrl(resource.content_url)
      if (downloadUrl) {
        window.open(downloadUrl, "_blank")
      }
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Handle iframe load
  const handleIframeLoad = () => {
    setIframeLoading(false)
  }

  // Handle iframe error
  const handleIframeError = () => {
    setIframeLoading(false)
    setIframeError(true)
  }

  // Retry loading
  const handleRetry = () => {
    setIframeLoading(true)
    setIframeError(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="w-full aspect-[4/3] rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/Resources")}
            className="gap-1.5 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Button>
          
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Resource Not Found</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {error || "The resource you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => router.push("/Resources")}>
              Browse All Resources
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const config = resourceTypeConfig[resource.type] || { 
    icon: FileText, 
    label: resource.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800"
  }
  const TypeIcon = config.icon
  const embedUrl = getGoogleDriveEmbedUrl(resource.content_url)

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-b from-background to-muted/20",
      isFullscreen && "fixed inset-0 z-50 bg-background"
    )}>
      {!isFullscreen && <Header />}
      
      <div className={cn(
        "container mx-auto px-4 py-6",
        isFullscreen && "h-full p-0"
      )}>
        {/* Back button */}
        {!isFullscreen && (
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/Resources")}
              className="gap-1.5 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Resources
            </Button>
            
            {/* Quick actions for mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              {resource.content_url && (
                <Button variant="outline" size="sm" onClick={openInNewTab}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className={cn(
          "grid gap-6",
          isFullscreen ? "h-full" : "grid-cols-1 lg:grid-cols-3"
        )}>
          {/* Left side - Preview */}
          <div className={cn(
            "lg:col-span-2",
            isFullscreen && "h-full"
          )}>
            <Card className={cn(
              "overflow-hidden",
              isFullscreen && "h-full rounded-none border-0"
            )}>
              {/* Preview Header */}
              <CardHeader className={cn(
                "border-b bg-muted/30 py-3",
                isFullscreen && "absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.bgColor)}>
                      <TypeIcon className={cn("w-5 h-5", config.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold line-clamp-1">
                        {resource.title}
                      </CardTitle>
                      {resource.course && (
                        <CardDescription className="text-xs">
                          {resource.course.course_code} • {resource.course.title}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {resource.content_url && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={toggleFullscreen}
                          className="hidden sm:flex"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={openInNewTab}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {isFullscreen && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={toggleFullscreen}
                      >
                        Exit Fullscreen
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Preview Content */}
              <CardContent className={cn(
                "p-0 relative",
                isFullscreen ? "h-[calc(100%-4rem)] pt-16" : "aspect-[4/3]"
              )}>
                {resource.content_url && embedUrl ? (
                  <>
                    {/* Loading state */}
                    {iframeLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                        <div className="text-center">
                          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Loading preview...</p>
                        </div>
                      </div>
                    )}

                    {/* Error state */}
                    {iframeError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                        <div className="text-center">
                          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground mb-3">
                            Failed to load preview
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={handleRetry}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Retry
                            </Button>
                            <Button size="sm" onClick={openInNewTab}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open Original
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* iframe */}
                    <iframe
                      key={embedUrl}
                      src={embedUrl}
                      className="w-full h-full border-0"
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  </>
                ) : resource.description ? (
                  // Show description as content for syllabus type without URL
                  <div className="p-6 h-full overflow-auto">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold mb-4">{resource.title}</h3>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {resource.description}
                      </div>
                    </div>
                  </div>
                ) : (
                  // No content available
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No preview available for this resource
                      </p>
                      {resource.content_url && (
                        <Button className="mt-4" onClick={openInNewTab}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Original File
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right side - Details */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* Resource Info Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-3 rounded-xl", config.bgColor)}>
                      <TypeIcon className={cn("w-6 h-6", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className={cn("mb-2", config.color)}>
                        {config.label}
                      </Badge>
                      <CardTitle className="text-xl leading-tight">
                        {resource.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {resource.description && (
                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {resource.description}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Metadata */}
                  <div className="space-y-3">
                    {resource.exam_type && (
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Exam Type:</span>{" "}
                          <span className="font-medium">{examTypeLabels[resource.exam_type] || resource.exam_type}</span>
                        </span>
                      </div>
                    )}

                    {resource.file_format && (
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Format:</span>{" "}
                          <span className="font-medium uppercase">{resource.file_format}</span>
                        </span>
                      </div>
                    )}

                    {resource.file_size_mb && (
                      <div className="flex items-center gap-3">
                        <Download className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Size:</span>{" "}
                          <span className="font-medium">{resource.file_size_mb} MB</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Views:</span>{" "}
                        <span className="font-medium">{viewCount}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Downloads:</span>{" "}
                        <span className="font-medium">{downloadCount}</span>
                      </span>
                    </div>

                    {resource.semester_name && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Semester:</span>{" "}
                          <span className="font-medium">{resource.semester_name}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Added:</span>{" "}
                        <span className="font-medium">{formatRelativeTime(resource.created_at)}</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Info Card */}
              {resource.course && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-primary" />
                      Course Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold text-lg">{resource.course.course_code}</p>
                      <p className="text-sm text-muted-foreground">{resource.course.title}</p>
                    </div>

                    {resource.course.teacher_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{resource.course.teacher_name}</span>
                      </div>
                    )}

                    {resource.course.credits && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{resource.course.credits} Credits</span>
                      </div>
                    )}

                    {resource.course.semester && (
                      <Badge variant="secondary">
                        {resource.course.semester.title} - Section {resource.course.semester.section}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {resource.content_url && (
                    <>
                      <Button className="w-full gap-2" onClick={openInNewTab}>
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </Button>
                      
                      {resource.is_downloadable && (
                        <Button variant="outline" className="w-full gap-2" onClick={handleDownload}>
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      )}
                    </>
                  )}

                  <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Share Resource
                      </>
                    )}
                  </Button>

                  <Button variant="ghost" className="w-full gap-2" onClick={copyLink}>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </Button>
                </CardContent>
              </Card>

              {/* Date Info */}
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Added on {formatDate(resource.created_at)}</p>
                {resource.updated_at !== resource.created_at && (
                  <p>Last updated {formatDate(resource.updated_at)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Toaster />
    </div>
  )
}
