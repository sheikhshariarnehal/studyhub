"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  Sparkles,
  TrendingUp,
  Upload,
  User,
  Zap,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url?: string
  bio?: string
  phone?: string
  department?: string
  student_id?: string
  social_links?: Record<string, string>
  is_approved: boolean
  created_at: string
  batches?: {
    batch_name: string
    batch_number: number
  }
}

interface DashboardStats {
  totalContributions: number
  pendingApproval: number
  totalViews: number
  thisMonth: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalContributions: 0,
    pendingApproval: 0,
    totalViews: 0,
    thisMonth: 0,
  })
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include",
        })
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          calculateProfileCompletion(data.user)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const calculateProfileCompletion = (profile: UserProfile) => {
    const fields = [
      profile.full_name,
      profile.email,
      profile.avatar_url,
      profile.bio,
      profile.phone,
      profile.department,
      profile.student_id,
      profile.batches,
      profile.social_links && Object.keys(profile.social_links).length > 0,
    ]
    const completed = fields.filter(Boolean).length
    setProfileCompletion(Math.round((completed / fields.length) * 100))
  }

  const quickActions = [
    {
      title: "Create Bulk Content",
      description: "Add multiple semesters, courses & topics at once",
      icon: Layers,
      href: "/dashboard/create/bulk",
      color: "bg-gradient-to-br from-purple-500 to-indigo-600",
      badge: "Pro",
    },
    {
      title: "Add Resources",
      description: "Upload notes, questions, syllabus & more",
      icon: Upload,
      href: "/dashboard/create/resources",
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
    },
    {
      title: "Browse Content",
      description: "Explore available learning materials",
      icon: BookOpen,
      href: "/dashboard/browse",
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
    },
    {
      title: "Complete Profile",
      description: "Add more details to your profile",
      icon: User,
      href: "/dashboard/profile",
      color: "bg-gradient-to-br from-orange-500 to-amber-600",
    },
  ]

  const recentActivity = [
    { action: "Account created", time: "Just now", icon: CheckCircle2 },
    { action: "Profile updated", time: "2 hours ago", icon: User },
    { action: "Logged in", time: "Today", icon: Zap },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome to DIU Learning! 🎓
          </h1>
          <p className="text-muted-foreground mt-1">
            Your personal contributor dashboard. Start creating and sharing resources.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/create/bulk">
            <Sparkles className="mr-2 h-4 w-4" />
            Start Creating
          </Link>
        </Button>
      </div>

      {/* Approval Warning */}
      {user && !user.is_approved && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="flex items-start gap-4 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Account Pending Approval
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your account is currently awaiting admin approval. Some features like content creation 
                are limited until your account is approved. Complete your profile to speed up the process!
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="flex-shrink-0">
              <Link href="/dashboard/profile">
                Complete Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileCompletion}%</div>
            <Progress value={profileCompletion} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {profileCompletion < 100 ? "Complete your profile for better visibility" : "Profile complete!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContributions}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Resources you've shared
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-2">
              People helped by your content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <CheckCircle2 className={`h-4 w-4 ${user?.is_approved ? "text-green-500" : "text-yellow-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.is_approved ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-yellow-600">Pending</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user?.is_approved ? "Full access enabled" : "Awaiting admin approval"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="h-full hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${action.color} shadow-lg`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Follow these steps to make the most of DIU Learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                profileCompletion >= 50 ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
              }`}>
                {profileCompletion >= 50 ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">1</span>}
              </div>
              <div>
                <p className="font-medium text-sm">Complete your profile</p>
                <p className="text-xs text-muted-foreground">Add your photo, bio, and social links</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                user?.is_approved ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
              }`}>
                {user?.is_approved ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">2</span>}
              </div>
              <div>
                <p className="font-medium text-sm">Get approved</p>
                <p className="text-xs text-muted-foreground">Wait for admin to approve your account</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                <span className="text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-sm">Start contributing</p>
                <p className="text-xs text-muted-foreground">Create semesters, courses, and upload resources</p>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/dashboard/help">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Your Profile
            </CardTitle>
            <CardDescription>
              Quick overview of your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {user?.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold">{user?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {user?.batches && (
                    <Badge variant="secondary" className="text-xs">
                      {user.batches.batch_name}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {user?.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>

            {user?.bio ? (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No bio added yet. Tell others about yourself!
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-medium">{user?.department || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Student ID</p>
                <p className="font-medium">{user?.student_id || "Not set"}</p>
              </div>
            </div>

            <Button className="w-full" asChild>
              <Link href="/dashboard/profile">
                Edit Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Explore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Explore DIU Learning
          </CardTitle>
          <CardDescription>
            Discover resources shared by the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/" className="group">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Browse All Content
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Explore slides, videos & resources
                </p>
                <ExternalLink className="h-4 w-4 mt-2 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/browse-study-tools" className="group">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                <FolderOpen className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Study Tools
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Notes, questions, syllabi & more
                </p>
                <ExternalLink className="h-4 w-4 mt-2 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/browse-videos" className="group">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                <Clock className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Video Lectures
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Watch recorded lectures
                </p>
                <ExternalLink className="h-4 w-4 mt-2 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
