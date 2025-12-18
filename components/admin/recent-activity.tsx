"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, BookOpen, FileText, Play, Clock, Sparkles } from "lucide-react"

export function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        // Get recent items from different tables
        const [{ data: recentSemesters }, { data: recentCourses }, { data: recentTopics }, { data: recentSlides }] =
          await Promise.all([
            supabase.from("semesters").select("*").order("created_at", { ascending: false }).limit(2),
            supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(2),
            supabase.from("topics").select("*").order("created_at", { ascending: false }).limit(2),
            supabase.from("slides").select("*").order("created_at", { ascending: false }).limit(2),
          ])

        const activityData = [
          ...(recentSemesters || []).map((item) => ({
            id: item.id,
            type: "semester",
            title: `New semester "${item.title}" created`,
            time: item.created_at,
            icon: Calendar,
          })),
          ...(recentCourses || []).map((item) => ({
            id: item.id,
            type: "course",
            title: `New course "${item.title}" added`,
            time: item.created_at,
            icon: BookOpen,
          })),
          ...(recentTopics || []).map((item) => ({
            id: item.id,
            type: "topic",
            title: `New topic "${item.title}" created`,
            time: item.created_at,
            icon: FileText,
          })),
          ...(recentSlides || []).map((item) => ({
            id: item.id,
            type: "slide",
            title: `New slide "${item.title}" uploaded`,
            time: item.created_at,
            icon: Play,
          })),
        ]
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 5)

        setActivities(activityData)
      } catch (error) {
        console.error("Error fetching recent activity:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentActivity()
  }, [])

  const getActivityStyles = (type: string) => {
    switch (type) {
      case "semester":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-600",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
        }
      case "course":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-600",
          badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        }
      case "topic":
        return {
          bg: "bg-purple-500/10",
          text: "text-purple-600",
          badge: "bg-purple-100 text-purple-700 border-purple-200",
        }
      case "slide":
        return {
          bg: "bg-orange-500/10",
          text: "text-orange-600",
          badge: "bg-orange-100 text-orange-700 border-orange-200",
        }
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          badge: "bg-gray-100 text-gray-700 border-gray-200",
        }
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-3 rounded-xl bg-muted mb-4">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground mb-1">No recent activity</p>
        <p className="text-sm text-muted-foreground">Start adding content to see activity here</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => {
        const styles = getActivityStyles(activity.type)
        return (
          <div 
            key={`${activity.type}-${activity.id}`} 
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
          >
            <div className={`p-2.5 rounded-xl ${styles.bg} group-hover:scale-105 transition-transform`}>
              <activity.icon className={`h-4 w-4 ${styles.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {activity.title}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{getRelativeTime(activity.time)}</span>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`text-[10px] font-medium capitalize shrink-0 ${styles.badge}`}
            >
              {activity.type}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
