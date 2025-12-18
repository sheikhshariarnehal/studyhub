"use client"

import React, { useState, useEffect } from "react"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Calendar, 
  GraduationCap, 
  FileText, 
  BookOpen, 
  Layers,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Loader2,
  ExternalLink,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ProfileData {
  user: {
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
  stats: {
    resources: number
    semesters: number
    courses: number
  }
  recentResources: {
    id: string
    title: string
    type: string
    created_at: string
  }[]
}

// Role labels and colors
const roleConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  super_admin: { 
    label: "Super Admin", 
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900/30" 
  },
  admin: { 
    label: "Admin", 
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900/30" 
  },
  moderator: { 
    label: "Moderator", 
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30" 
  },
  content_creator: { 
    label: "Content Creator", 
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30" 
  },
  contributor: { 
    label: "Contributor", 
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/30" 
  },
}

interface ProfileCardDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  // Optional: Pass initial data to avoid loading
  initialData?: {
    full_name: string
    avatar_url: string | null
  }
}

export function ProfileCardDialog({ 
  userId,
  userName, 
  open, 
  onOpenChange,
  initialData 
}: ProfileCardDialogProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!open || !userId) return
      
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/users/${userId}/public`)
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

    fetchProfile()
  }, [userId, open])

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long"
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <VisuallyHidden.Root>
          <DialogTitle>User Profile</DialogTitle>
        </VisuallyHidden.Root>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        ) : error || !profileData ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <User className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{error || "Profile not found"}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header with gradient background */}
            <div className="relative">
              <div className="h-24 bg-gradient-to-br from-primary/80 via-primary to-primary/60" />
              
              {/* Avatar overlapping the header */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                {profileData.user.avatar_url ? (
                  <img 
                    src={profileData.user.avatar_url} 
                    alt={profileData.user.full_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-lg">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="pt-14 pb-6 px-6">
              {/* Name and Role */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{profileData.user.full_name}</h2>
                {(() => {
                  const roleInfo = roleConfig[profileData.user.role] || { 
                    label: profileData.user.role, 
                    color: "text-gray-700 dark:text-gray-300",
                    bgColor: "bg-gray-100 dark:bg-gray-800" 
                  }
                  return (
                    <Badge className={cn("mt-2", roleInfo.bgColor, roleInfo.color)}>
                      {roleInfo.label}
                    </Badge>
                  )
                })()}
              </div>

              {/* Bio */}
              {profileData.user.bio && (
                <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">
                  {profileData.user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <FileText className="w-5 h-5 text-blue-500 mb-1" />
                  <span className="text-lg font-bold">{profileData.stats.resources}</span>
                  <span className="text-xs text-muted-foreground">Resources</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <Layers className="w-5 h-5 text-purple-500 mb-1" />
                  <span className="text-lg font-bold">{profileData.stats.semesters}</span>
                  <span className="text-xs text-muted-foreground">Semesters</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <BookOpen className="w-5 h-5 text-green-500 mb-1" />
                  <span className="text-lg font-bold">{profileData.stats.courses}</span>
                  <span className="text-xs text-muted-foreground">Courses</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Info */}
              <div className="space-y-2 text-sm">
                {profileData.user.batch && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData.user.batch.batch_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {formatJoinDate(profileData.user.created_at)}</span>
                </div>
              </div>

              {/* Social Links */}
              {profileData.user.social_links && Object.keys(profileData.user.social_links).some(k => profileData.user.social_links?.[k as keyof typeof profileData.user.social_links]) && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-center gap-2">
                    {profileData.user.social_links.github && (
                      <a 
                        href={profileData.user.social_links.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {profileData.user.social_links.linkedin && (
                      <a 
                        href={profileData.user.social_links.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {profileData.user.social_links.twitter && (
                      <a 
                        href={profileData.user.social_links.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {profileData.user.social_links.website && (
                      <a 
                        href={profileData.user.social_links.website} 
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

              {/* View Full Profile Button */}
              <div className="mt-4">
                <Link href={`/contributor/${encodeURIComponent(userName)}`} className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Full Profile
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
