"use client"

import { useState, useEffect } from "react"
import { ContentViewer } from "@/components/content-viewer"
import { parseSimpleShareUrl } from "@/lib/simple-share-utils"

interface ContentItem {
  id: string
  type: "slide" | "video" | "document" | "syllabus"
  title: string
  url: string
  topicTitle?: string
  courseTitle?: string
  description?: string
}

export default function TestDirectUrlPage() {
  const [content, setContent] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (info: string) => {
    setDebugInfo(prev => [...prev, info])
    console.log(info)
  }

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get current URL
        const currentUrl = window.location.href
        addDebug(`Current URL: ${currentUrl}`)
        
        // Parse URL
        const parsedUrl = parseSimpleShareUrl(currentUrl)
        addDebug(`Parsed URL: ${JSON.stringify(parsedUrl)}`)
        
        if (parsedUrl) {
          // Build API endpoint
          const apiEndpoint = `/api/${parsedUrl.type === 'slide' ? 'slides' : parsedUrl.type === 'video' ? 'videos' : 'study-tools'}/${parsedUrl.id}`
          addDebug(`API Endpoint: ${apiEndpoint}`)
          
          // Fetch data
          const response = await fetch(apiEndpoint)
          addDebug(`Response status: ${response.status}`)
          
          if (response.ok) {
            const data = await response.json()
            addDebug(`API Response: ${JSON.stringify(data, null, 2)}`)
            
            // Create content item
            const contentItem: ContentItem = {
              id: data.id,
              type: parsedUrl.type as "slide" | "video",
              title: data.title,
              url: data.url,
              topicTitle: data.topic?.title,
              courseTitle: data.topic?.course?.title || data.course?.title,
              description: data.description,
            }
            
            addDebug(`Content item created: ${JSON.stringify(contentItem)}`)
            setContent(contentItem)
          } else {
            const errorText = await response.text()
            addDebug(`API Error: ${errorText}`)
            setError(`API Error: ${response.status} - ${errorText}`)
          }
        } else {
          addDebug("No valid shareable URL found")
          setError("No valid shareable URL found in current path")
        }
      } catch (err) {
        const errorMsg = `Error: ${err}`
        addDebug(errorMsg)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }
    
    loadContent()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading Content...</h1>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          {debugInfo.map((info, index) => (
            <div key={index} className="text-sm font-mono mb-1">{info}</div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Content</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          {debugInfo.map((info, index) => (
            <div key={index} className="text-sm font-mono mb-1">{info}</div>
          ))}
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">No Content Found</h1>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          {debugInfo.map((info, index) => (
            <div key={index} className="text-sm font-mono mb-1">{info}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Content Loaded Successfully!</h1>
      <p className="mb-4">Title: {content.title}</p>
      <p className="mb-4">Course: {content.courseTitle}</p>
      <p className="mb-4">Topic: {content.topicTitle}</p>
      
      <div className="aspect-video mb-4">
        <ContentViewer content={content} isLoading={false} />
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        {debugInfo.map((info, index) => (
          <div key={index} className="text-sm font-mono mb-1">{info}</div>
        ))}
      </div>
    </div>
  )
}
