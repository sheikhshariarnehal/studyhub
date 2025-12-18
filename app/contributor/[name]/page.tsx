"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  GraduationCap,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Globe,
  FileQuestion,
  ClipboardList,
  FlaskConical,
  Library,
  Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  full_name: string
  email: string | null
  avatar_url: string | null
  bio: string | null
  social_links: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  } | null
  batch_id: string | null
  batch: {
    id: string
    batch_name: string
  } | null
  role: string
  created_at: string
}

interface Resource {
  id: string
  title: string
  type: string
  created_at: string
}

interface ProfileData {
  user: UserProfile
  stats: {
    resources: number
    semesters: number
    courses: number
  }
  recentResources: Resource[]
}

// Resource type icons
const resourceTypeIcons: Record<string, React.ElementType> = {
  previous_questions: FileQuestion,
  exam_note: BookOpen,
  syllabus: ClipboardList,
  lab_manual: FlaskConical,
  reference_book: Library,
}

// Role labels and colors
const roleConfig: Record<string, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  admin: { label: "Admin", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  moderator: { label: "Moderator", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  content_creator: { label: "Content Creator", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  contributor: { label: "Contributor", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
}

// Generate slug for resource URL
function generateSlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50)
  const shortId = id.substring(0, 8)
  return `${slug}-${shortId}`
}

export default function ContributorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userName = params.name as string

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/users/by-name/${encodeURIComponent(userName)}`)
        const data = await response.json()

        if (data.success) {
          setProfileData(data)
        } else {
          setError(data.error || "Failed to load profile")
        }
      } catch (err) {
        setError("Failed to load profile")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (userName) {
      fetchProfile()
    }
  }, [userName])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long"
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-1.5 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {error || "The contributor profile you're looking for doesn't exist."}
            </p>
            <Button onClick={() => router.push("/")}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { user, stats, recentResources } = profileData
  const roleInfo = roleConfig[user.role] || { label: user.role, color: "bg-gray-100 text-gray-800" }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-1.5 mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.full_name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-muted mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-muted mb-4">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                  )}

                  {/* Name and Role */}
                  <h1 className="text-2xl font-bold mb-2">{user.full_name}</h1>
                  <Badge className={cn("mb-4", roleInfo.color)}>
                    {roleInfo.label}
                  </Badge>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-muted-foreground text-sm mb-4">
                      {user.bio}
                    </p>
                  )}

                  <Separator className="my-4 w-full" />

                  {/* Info */}
                  <div className="w-full space-y-3 text-left">
                    {user.batch && (
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.batch.batch_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Joined {formatJoinDate(user.created_at)}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  {user.social_links && Object.keys(user.social_links).length > 0 && (
                    <>
                      <Separator className="my-4 w-full" />
                      <div className="flex items-center gap-3">
                        {user.social_links.github && (
                          <a 
                            href={user.social_links.github} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Github className="w-5 h-5" />
                          </a>
                        )}
                        {user.social_links.linkedin && (
                          <a 
                            href={user.social_links.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                        {user.social_links.twitter && (
                          <a 
                            href={user.social_links.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Twitter className="w-5 h-5" />
                          </a>
                        )}
                        {user.social_links.website && (
                          <a 
                            href={user.social_links.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Globe className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <FileText className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-2xl font-bold">{stats.resources}</span>
                    <span className="text-sm text-muted-foreground">Resources</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <Layers className="w-8 h-8 text-purple-500 mb-2" />
                    <span className="text-2xl font-bold">{stats.semesters}</span>
                    <span className="text-sm text-muted-foreground">Semesters</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <BookOpen className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-2xl font-bold">{stats.courses}</span>
                    <span className="text-sm text-muted-foreground">Courses</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Contributions</CardTitle>
                <CardDescription>
                  Latest resources shared by {user.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentResources.length > 0 ? (
                  <div className="space-y-3">
                    {recentResources.map((resource) => {
                      const ResourceIcon = resourceTypeIcons[resource.type] || FileText
                      return (
                        <Link
                          key={resource.id}
                          href={`/Resources/${generateSlug(resource.title, resource.id)}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="p-2 rounded-lg bg-muted">
                            <ResourceIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">
                              {resource.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(resource.created_at)}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No resources shared yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
