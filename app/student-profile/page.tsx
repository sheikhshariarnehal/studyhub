"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Phone, Building2, Users, Loader2, Save, IdCard, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Department {
  id: string
  name: string
  short_name: string
}

interface Batch {
  id: string
  batch_number: number
  batch_name: string
}

export default function StudentProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [studentId, setStudentId] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")

  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, deptRes, batchRes] = await Promise.all([
          fetch("/api/student/profile"),
          fetch("/api/departments"),
          fetch("/api/batches")
        ])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          if (profileData.success) {
            const profile = profileData.profile
            setFullName(profile.full_name || "")
            setPhone(profile.phone || "")
            setStudentId(profile.student_id || "")
            setSelectedDepartment(profile.department_id || "")
            setSelectedBatch(profile.batch_id || "")
          }
        }

        if (deptRes.ok) {
          const deptData = await deptRes.json()
          if (deptData.success) {
            setDepartments(deptData.departments)
          }
        }

        if (batchRes.ok) {
          const batchData = await batchRes.json()
          if (batchData.success) {
            setBatches(batchData.batches)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user && user.role === "student") {
      fetchData()
    }
  }, [user, toast])

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const response = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          student_id: studentId,
          department_id: selectedDepartment,
          batch_id: selectedBatch
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        })
        setIsEditing(false)
        // Reload page to update context
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "student") {
    return null
  }

  const currentDept = departments.find(d => d.id === selectedDepartment)
  const currentBatch = batches.find(b => b.id === selectedBatch)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Study
          </Button>

          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Profile
            </CardTitle>
            <CardDescription>
              {isEditing ? "Edit your profile information" : "View and manage your profile"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing}
                  className={cn("pl-10", !isEditing && "bg-muted")}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID (Optional)</Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={!isEditing}
                  className={cn("pl-10", !isEditing && "bg-muted")}
                  placeholder="Enter your student ID"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className={cn("pl-10", !isEditing && "bg-muted")}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              {isEditing ? (
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="department">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select department" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} {dept.short_name && `(${dept.short_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={currentDept ? `${currentDept.name} (${currentDept.short_name})` : "Not set"}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Changing department will filter content accordingly
                </p>
              )}
            </div>

            {/* Batch */}
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              {isEditing ? (
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger id="batch">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select batch" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batch_name} (Batch {batch.batch_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={currentBatch ? `${currentBatch.batch_name} (Batch ${currentBatch.batch_number})` : "Not set"}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Changing batch will filter content accordingly
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !selectedDepartment || !selectedBatch}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Your department and batch selection determines what courses and content you can access. 
              You can change these at any time to view content from different departments or batches.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
