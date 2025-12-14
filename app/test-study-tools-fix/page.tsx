"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestStudyToolsFixPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (result: any) => {
    setResults(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      ...result 
    }])
  }

  const testStudyToolsList = async () => {
    setLoading(true)
    try {
      addResult({ test: 'Study Tools List', status: 'Starting...' })
      
      const response = await fetch('/api/study-tools-list')
      const data = await response.json()
      
      addResult({ 
        test: 'Study Tools List', 
        status: response.status, 
        success: response.ok,
        count: data.studyTools?.length || 0,
        data 
      })
      
      // Test first study tool if available
      if (data.studyTools && data.studyTools.length > 0) {
        const firstStudyTool = data.studyTools[0]
        await testSpecificStudyTool(firstStudyTool.id)
      }
    } catch (error) {
      addResult({ 
        test: 'Study Tools List', 
        error: error.toString() 
      })
    }
    setLoading(false)
  }

  const testSpecificStudyTool = async (studyToolId?: string) => {
    const testId = studyToolId || 'test-study-tool-123'
    
    try {
      addResult({ 
        test: 'Specific Study Tool', 
        status: `Testing study tool ID: ${testId}` 
      })
      
      const response = await fetch(`/api/study-tools-simple/${testId}`)
      const data = await response.json()
      
      addResult({ 
        test: 'Specific Study Tool', 
        status: response.status, 
        success: response.ok,
        studyToolId: testId,
        data 
      })
    } catch (error) {
      addResult({ 
        test: 'Specific Study Tool', 
        error: error.toString(),
        studyToolId: testId
      })
    }
  }

  const testStudyToolShare = async () => {
    setLoading(true)
    try {
      // First get a real study tool ID
      const listResponse = await fetch('/api/study-tools-list')
      const listData = await listResponse.json()
      
      if (listData.studyTools && listData.studyTools.length > 0) {
        const firstStudyTool = listData.studyTools[0]
        const shareUrl = `${window.location.origin}/study-tool/${firstStudyTool.id}`
        
        addResult({ 
          test: 'Study Tool Share', 
          status: `Generated share URL: ${shareUrl}` 
        })
        
        // Open share URL
        window.open(shareUrl, '_blank')
        
        addResult({ 
          test: 'Study Tool Share', 
          status: 'Opened share URL in new tab - check if it loads correctly' 
        })
      } else {
        addResult({ 
          test: 'Study Tool Share', 
          error: 'No study tools found to test with' 
        })
      }
    } catch (error) {
      addResult({ 
        test: 'Study Tool Share', 
        error: error.toString() 
      })
    }
    setLoading(false)
  }

  const compareWithSlides = async () => {
    setLoading(true)
    try {
      addResult({ test: 'Compare APIs', status: 'Comparing study tools with slides API...' })
      
      // Test slides API (working reference)
      const slidesResponse = await fetch('/api/slides-list')
      const slidesData = await slidesResponse.json()
      
      addResult({ 
        test: 'Slides API (Reference)', 
        status: slidesResponse.status, 
        success: slidesResponse.ok,
        count: slidesData.slides?.length || 0
      })
      
      // Test study tools API
      const studyToolsResponse = await fetch('/api/study-tools-list')
      const studyToolsData = await studyToolsResponse.json()
      
      addResult({ 
        test: 'Study Tools API', 
        status: studyToolsResponse.status, 
        success: studyToolsResponse.ok,
        count: studyToolsData.studyTools?.length || 0
      })
      
      // Compare structure
      if (slidesData.slides?.length > 0 && studyToolsData.studyTools?.length > 0) {
        const slideStructure = Object.keys(slidesData.slides[0])
        const studyToolStructure = Object.keys(studyToolsData.studyTools[0])
        
        addResult({ 
          test: 'Structure Comparison', 
          slideFields: slideStructure,
          studyToolFields: studyToolStructure,
          match: JSON.stringify(slideStructure) === JSON.stringify(studyToolStructure)
        })
      }
      
    } catch (error) {
      addResult({ 
        test: 'Compare APIs', 
        error: error.toString() 
      })
    }
    setLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Study Tools Fix</h1>
      
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">🔧 Study Tools Fix</h2>
          <p className="text-yellow-700 text-sm">
            Fixed study tools API to use correct column names: `content_url` instead of `google_drive_url`, 
            and `type` instead of `study_tool_type`. Testing if study tools now work like slides.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={testStudyToolsList} disabled={loading} size="sm">
            1. List Study Tools
          </Button>
          <Button onClick={() => testSpecificStudyTool()} disabled={loading} size="sm">
            2. Test Specific ID
          </Button>
          <Button onClick={testStudyToolShare} disabled={loading} size="sm">
            3. Test Share URL
          </Button>
          <Button onClick={compareWithSlides} disabled={loading} size="sm">
            4. Compare with Slides
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
                      Count: {result.count}
                    </div>
                  )}
                  
                  {result.studyToolId && (
                    <div className="text-sm mb-1 text-gray-600">
                      Study Tool ID: {result.studyToolId}
                    </div>
                  )}
                  
                  {result.slideFields && (
                    <div className="text-sm mb-1">
                      <div className="text-green-600">Slide Fields: {result.slideFields.join(', ')}</div>
                      <div className="text-blue-600">Study Tool Fields: {result.studyToolFields.join(', ')}</div>
                      <div className={result.match ? 'text-green-600' : 'text-red-600'}>
                        Structure Match: {result.match ? 'Yes' : 'No'}
                      </div>
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
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Expected Results:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>List Study Tools:</strong> Should return count {'>'}  0 with study tools data</li>
            <li><strong>Test Specific ID:</strong> Should return 200 with study tool data</li>
            <li><strong>Test Share URL:</strong> Should open working study tool page</li>
            <li><strong>Compare with Slides:</strong> Should show similar API structure</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
