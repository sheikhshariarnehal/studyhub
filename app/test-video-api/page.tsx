"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestVideoApiPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [testVideoId, setTestVideoId] = useState("")

  const addResult = (result: any) => {
    setResults(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      ...result 
    }])
  }

  const testVideosList = async () => {
    setLoading(true)
    try {
      addResult({ test: 'Videos List', status: 'Starting...' })
      
      const response = await fetch('/api/videos-list')
      const data = await response.json()
      
      addResult({ 
        test: 'Videos List', 
        status: response.status, 
        success: response.ok,
        count: data.count || 0,
        data 
      })
      
      // Set first video ID for testing
      if (data.videos && data.videos.length > 0) {
        setTestVideoId(data.videos[0].id)
        addResult({ 
          test: 'Auto-set Test ID', 
          status: `Set test video ID to: ${data.videos[0].id}` 
        })
      }
    } catch (error) {
      addResult({ 
        test: 'Videos List', 
        error: error.toString() 
      })
    }
    setLoading(false)
  }

  const testSpecificVideo = async (videoId?: string) => {
    const idToTest = videoId || testVideoId
    if (!idToTest) {
      addResult({ 
        test: 'Specific Video Test', 
        error: 'No video ID provided. Run "List Videos" first or enter an ID manually.' 
      })
      return
    }

    setLoading(true)
    try {
      addResult({ 
        test: 'Specific Video Test', 
        status: `Testing video ID: ${idToTest}` 
      })
      
      const response = await fetch(`/api/videos-simple/${idToTest}`)
      const data = await response.json()
      
      addResult({ 
        test: 'Specific Video Test', 
        status: response.status, 
        success: response.ok,
        videoId: idToTest,
        data 
      })
    } catch (error) {
      addResult({ 
        test: 'Specific Video Test', 
        error: error.toString(),
        videoId: idToTest
      })
    }
    setLoading(false)
  }

  const testVideoShare = async () => {
    if (!testVideoId) {
      addResult({ 
        test: 'Video Share Test', 
        error: 'No video ID available. Run "List Videos" first.' 
      })
      return
    }

    setLoading(true)
    try {
      const shareUrl = `${window.location.origin}/video/${testVideoId}`
      addResult({ 
        test: 'Video Share Test', 
        status: `Generated share URL: ${shareUrl}` 
      })
      
      // Test if the share URL works by opening it
      window.open(shareUrl, '_blank')
      
      addResult({ 
        test: 'Video Share Test', 
        status: 'Opened share URL in new tab - check if it loads correctly' 
      })
    } catch (error) {
      addResult({ 
        test: 'Video Share Test', 
        error: error.toString() 
      })
    }
    setLoading(false)
  }

  const testMainPageVideoSelection = () => {
    addResult({ 
      test: 'Main Page Test', 
      status: 'Opening main page - try selecting a video from Course Content sidebar' 
    })
    window.open('/', '_blank')
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Video API - Debug 500 Error</h1>
      
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">🐛 Current Issue</h2>
          <p className="text-red-700 text-sm">
            Getting 500 Internal Server Error when selecting and sharing videos.
            This page will test the video API step by step.
          </p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Test Video ID:</h3>
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={testVideoId}
              onChange={(e) => setTestVideoId(e.target.value)}
              placeholder="Enter video ID to test (or run List Videos to auto-populate)"
              className="flex-1 p-2 border rounded text-sm"
            />
            <Button onClick={() => testSpecificVideo()} size="sm" disabled={!testVideoId}>
              Test This ID
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={testVideosList} disabled={loading} size="sm">
            1. List Videos
          </Button>
          <Button onClick={() => testSpecificVideo()} disabled={loading || !testVideoId} size="sm">
            2. Test Video API
          </Button>
          <Button onClick={testVideoShare} disabled={loading || !testVideoId} size="sm">
            3. Test Share URL
          </Button>
          <Button onClick={testMainPageVideoSelection} disabled={loading} size="sm">
            4. Test Main Page
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
          {loading && <span className="text-blue-600 text-sm">Testing...</span>}
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500 text-sm">No test results yet. Run tests above in order (1→2→3→4).</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{result.test}</span>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                  
                  {result.status && (
                    <div className={`text-sm mb-1 ${
                      typeof result.status === 'number' 
                        ? result.status === 200 ? 'text-green-600' : result.status === 404 ? 'text-yellow-600' : 'text-red-600'
                        : 'text-blue-600'
                    }`}>
                      Status: {result.status}
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-red-600 text-sm mb-1">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.success !== undefined && (
                    <div className={`text-sm mb-1 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      Success: {result.success ? 'Yes' : 'No'}
                    </div>
                  )}
                  
                  {result.count !== undefined && (
                    <div className="text-sm mb-1 text-blue-600">
                      Videos Found: {result.count}
                    </div>
                  )}
                  
                  {result.videoId && (
                    <div className="text-sm mb-1 text-gray-600">
                      Video ID: {result.videoId}
                    </div>
                  )}
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">View Data</summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debugging Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li><strong>List Videos:</strong> Shows what videos exist in your database</li>
            <li><strong>Test Video API:</strong> Tests the video API with a specific ID</li>
            <li><strong>Test Share URL:</strong> Tests the shareable video URL</li>
            <li><strong>Test Main Page:</strong> Opens main page to test sidebar selection</li>
          </ol>
          
          <div className="mt-3 p-2 bg-yellow-100 rounded text-sm">
            <strong>Expected Results:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>List Videos: Should show count {'>'} 0 and video data</li>
              <li>Test Video API: Should return 200 status with video data</li>
              <li>Test Share URL: Should open working video page</li>
              <li>Main Page: Video selection should work without 500 error</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
