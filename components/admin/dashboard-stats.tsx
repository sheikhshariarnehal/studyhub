"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Play, 
  AlertCircle, 
  TrendingUp,
  Wrench,
  GraduationCap
} from "lucide-react"

export function DashboardStats() {
  const [stats, setStats] = useState({
    semesterCount: 0,
    courseCount: 0,
    topicCount: 0,
    slideCount: 0,
    videoCount: 0,
    studyToolCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setError(null)
        
        // Add timeout to prevent indefinite loading
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )

        const statsPromise = Promise.all([
          supabase.from("semesters").select("*", { count: "exact", head: true }),
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase.from("topics").select("*", { count: "exact", head: true }),
          supabase.from("slides").select("*", { count: "exact", head: true }),
          supabase.from("videos").select("*", { count: "exact", head: true }),
          supabase.from("study_tools").select("*", { count: "exact", head: true }),
        ])

        const [
          { count: semesterCount, error: semesterError },
          { count: courseCount, error: courseError },
          { count: topicCount, error: topicError },
          { count: slideCount, error: slideError },
          { count: videoCount, error: videoError },
          { count: studyToolCount, error: studyToolError },
        ] = await Promise.race([statsPromise, timeout]) as any[]

        // Check for errors
        const errors = [semesterError, courseError, topicError, slideError, videoError, studyToolError].filter(Boolean)
        if (errors.length > 0) {
          throw new Error(errors[0].message)
        }

        setStats({
          semesterCount: semesterCount || 0,
          courseCount: courseCount || 0,
          topicCount: topicCount || 0,
          slideCount: slideCount || 0,
          videoCount: videoCount || 0,
          studyToolCount: studyToolCount || 0,
        })
      } catch (error: any) {
        console.error("Error fetching dashboard stats:", error)
        setError(error?.message || "Failed to load statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statsData = [
    {
      title: "Semesters",
      value: stats.semesterCount,
      icon: Calendar,
      description: "Active semesters",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600",
    },
    {
      title: "Courses",
      value: stats.courseCount,
      icon: BookOpen,
      description: "Total courses",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-600",
    },
    {
      title: "Topics",
      value: stats.topicCount,
      icon: FileText,
      description: "Learning topics",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-600",
    },
    {
      title: "Slides",
      value: stats.slideCount,
      icon: GraduationCap,
      description: "Presentation slides",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-600",
    },
    {
      title: "Videos",
      value: stats.videoCount,
      icon: Play,
      description: "Video lessons",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500/10",
      textColor: "text-red-600",
    },
    {
      title: "Study Tools",
      value: stats.studyToolCount,
      icon: Wrench,
      description: "Learning tools",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-500/10",
      textColor: "text-cyan-600",
    },
  ]

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}. Please check your database connection and try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalContent = stats.slideCount + stats.videoCount + stats.studyToolCount

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statsData.map((stat) => (
        <Card 
          key={stat.title} 
          className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-muted-foreground/20"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Active</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm font-medium text-foreground">{stat.title}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
