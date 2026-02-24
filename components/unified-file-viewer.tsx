"use client"

import { useState, useEffect } from "react"
import { ContentViewer } from "@/components/content-viewer"
import { ShareButton } from "@/components/share-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { 
  generateShareUrl, 
  generateShareMetadata, 
  generateDownloadUrl,
  getContentTypeDisplayName,
  type ShareableContent 
} from "@/lib/share-utils"
import { 
  Download, 
  ExternalLink, 
  Eye, 
  Calendar, 
  User, 
  BookOpen, 
  GraduationCap,
  FileText,
  Play,
  Presentation
} from "lucide-react"

interface UnifiedFileViewerProps {
  contentId: string
  contentType: 'video' | 'slide' | 'study-tool'
  showHeader?: boolean
  showDetails?: boolean
  showActions?: boolean
  className?: string
  aspectRatio?: 'video' | 'document' | 'auto'
}

interface ContentData extends ShareableContent {
  topic?: {
    id: string
    title: string
    course: {
      id: string
      title: string
      courseCode: string
      teacherName: string
      semester: {
        id: string
        title: string
        section: string
        name: string
      }
    }
  }
  course?: {
    id: string
    title: string
    courseCode: string
    teacherName: string
    semester: {
      id: string
      title: string
      section: string
      name: string
    }
  }
  studyToolType?: string
  examType?: string
  fileSize?: string
  duration?: string
  createdAt?: string
  updatedAt?: string
}

export function UnifiedFileViewer({
  contentId,
  contentType,
  showHeader = true,
  showDetails = true,
  showActions = true,
  className = "",
  aspectRatio = 'auto'
}: UnifiedFileViewerProps) {
  const [content, setContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const apiEndpoint = `/api/${contentType === 'slide' ? 'slides' : contentType === 'video' ? 'videos' : 'study-tools'}/${contentId}`
        const response = await fetch(apiEndpoint)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${contentType}`)
        }
        
        const data = await response.json()
        setContent(data)
      } catch (err) {
        console.error(`Error fetching ${contentType}:`, err)
        setError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [contentId, contentType])

  const handleDownload = () => {
    if (!content) return
    
    try {
      const downloadUrl = generateDownloadUrl(contentType, content.url)
      window.open(downloadUrl, '_blank')
      
      toast({
        title: "Download Started",
        description: `Opening ${content.title}`,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Failed",
        description: "Unable to download content. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getContentIcon = () => {
    switch (contentType) {
      case 'video':
        return <Play className="h-4 w-4" />
      case 'slide':
        return <Presentation className="h-4 w-4" />
      case 'study-tool':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getAspectRatioClass = () => {
    if (aspectRatio === 'video') return 'aspect-video'
    if (aspectRatio === 'document') return 'aspect-[4/3]'
    
    // Auto-detect based on content type
    switch (contentType) {
      case 'video':
        return 'aspect-video'
      case 'slide':
      case 'study-tool':
        return 'aspect-[4/3]'
      default:
        return 'aspect-video'
    }
  }

  const getExamTypeBadgeColor = (examType: string) => {
    const colorMap: Record<string, string> = {
      'midterm': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'final': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'both': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    return colorMap[examType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const getStudyToolTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'previous_questions': 'Previous Questions',
      'exam_note': 'Exam Notes',
      'syllabus': 'Syllabus',
      'mark_distribution': 'Mark Distribution'
    }
    return typeMap[type] || type
  }

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              {showActions && (
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <div className={getAspectRatioClass()}>
            <Skeleton className="w-full h-full" />
          </div>
          {showDetails && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (error || !content) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error || 'Content not found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              The requested {getContentTypeDisplayName(contentType).toLowerCase()} could not be loaded.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const shareMetadata = generateShareMetadata(content)
  const shareUrl = generateShareUrl(contentType, contentId)

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getContentIcon()}
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {content.title}
                    </h2>
                    {content.examType && (
                      <Badge className={getExamTypeBadgeColor(content.examType)}>
                        {content.examType.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(contentType === 'study-tool' ? content.course?.title : (content.topic?.course?.title || content.course?.title))}
                    {contentType !== 'study-tool' && content.topic?.title && ` • ${content.topic.title}`}
                    {content.studyToolType && ` • ${getStudyToolTypeLabel(content.studyToolType)}`}
                  </p>
                </div>
              </div>
            </div>
            {showActions && (
              <div className="flex items-center space-x-2">
                <ShareButton 
                  url={shareUrl}
                  title={shareMetadata.title}
                  description={shareMetadata.description}
                />
                <Button onClick={handleDownload} variant="outline" size="sm">
                  {contentType === 'video' ? (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className={getAspectRatioClass()}>
          <ContentViewer 
            content={{
              id: content.id,
              title: content.title,
              url: content.url,
              type: contentType === 'study-tool' && content.studyToolType === 'syllabus' ? 'syllabus' : 
                    contentType === 'study-tool' ? 'document' : contentType,
              topicTitle: contentType === 'study-tool' ? undefined : content.topic?.title,
              courseTitle: contentType === 'study-tool' ? content.course?.title : (content.topic?.course?.title || content.course?.title)
            }}
          />
        </div>
        
        {showDetails && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Course Information
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                    <dt className="font-medium text-gray-500 dark:text-gray-400 mr-2">Course:</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {contentType === 'study-tool' ? content.course?.title : (content.topic?.course?.title || content.course?.title)}
                    </dd>
                  </div>
                  {content.topic && (
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      <dt className="font-medium text-gray-500 dark:text-gray-400 mr-2">Topic:</dt>
                      <dd className="text-gray-900 dark:text-white">{content.topic.title}</dd>
                    </div>
                  )}
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <dt className="font-medium text-gray-500 dark:text-gray-400 mr-2">Instructor:</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {content.topic?.course.teacherName || content.course?.teacherName}
                    </dd>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <dt className="font-medium text-gray-500 dark:text-gray-400 mr-2">Semester:</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {content.topic?.course.semester.title || content.course?.semester.title}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  {getContentTypeDisplayName(contentType)} Details
                </h3>
                <dl className="space-y-2 text-sm">
                  {content.studyToolType && (
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400">Type:</dt>
                      <dd className="text-gray-900 dark:text-white mt-1">
                        {getStudyToolTypeLabel(content.studyToolType)}
                      </dd>
                    </div>
                  )}
                  {content.duration && (
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400">Duration:</dt>
                      <dd className="text-gray-900 dark:text-white mt-1">{content.duration}</dd>
                    </div>
                  )}
                  {content.fileSize && (
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400">File Size:</dt>
                      <dd className="text-gray-900 dark:text-white mt-1">{content.fileSize}</dd>
                    </div>
                  )}
                  {content.createdAt && (
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400">Added:</dt>
                      <dd className="text-gray-900 dark:text-white mt-1">
                        {new Date(content.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {content.description && (
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400">Description:</dt>
                      <dd className="text-gray-600 dark:text-gray-300 mt-1">{content.description}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
