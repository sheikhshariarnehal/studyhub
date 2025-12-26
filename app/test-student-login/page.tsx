"use client"

import { useState } from "react"

export default function TestStudentLogin() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log("Testing student login...")
      
      // First get departments
      const deptRes = await fetch("/api/departments")
      const deptData = await deptRes.json()
      console.log("Departments:", deptData)
      
      if (!deptData.success || !deptData.departments.length) {
        setResult({ error: "No departments found" })
        setLoading(false)
        return
      }
      
      // Get batches
      const batchRes = await fetch("/api/batches")
      const batchData = await batchRes.json()
      console.log("Batches:", batchData)
      
      if (!batchData.success || !batchData.batches.length) {
        setResult({ error: "No batches found" })
        setLoading(false)
        return
      }
      
      // Try to login
      const loginPayload = {
        email: "test@student.com",
        department_id: deptData.departments[0].id,
        batch_id: batchData.batches[0].id,
        full_name: "Test Student"
      }
      
      console.log("Login payload:", loginPayload)
      
      const loginRes = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginPayload)
      })
      
      const loginData = await loginRes.json()
      console.log("Login response:", loginData)
      setResult(loginData)
      
      if (loginData.success) {
        console.log("Login successful! Checking auth...")
        
        // Check if we can verify the auth
        const meRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include"
        })
        
        const meData = await meRes.json()
        console.log("Auth check:", meData)
        setResult({ ...loginData, authCheck: meData })
      }
      
    } catch (error) {
      console.error("Test error:", error)
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Student Login</h1>
      
      <button
        onClick={testLogin}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? "Testing..." : "Run Test"}
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
