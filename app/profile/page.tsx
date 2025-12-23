"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Phone,
  Building2,
  Loader2,
  AlertCircle,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Facebook,
  Instagram,
  GraduationCap,
  Save,
  Camera,
  Edit3,
  X,
  Check,
  IdCard,
  Shield,
  Sparkles,
  Link2,
  UserCircle,
  Settings,
  ExternalLink,
  Upload,
  ImagePlus,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  social_links: {
    github?: string
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
    website?: string
  } | null
  student_id: string | null
  batch_id: string | null
  is_approved: boolean
  created_at: string
  updated_at: string
  batches: {
    id: string
    batch_number: number
    batch_name: string
  } | null
}

interface Batch {
  id: string
  batch_number: number
  batch_name: string
  start_year: number
  end_year: number
}

// Role labels and colors with gradients
const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType; gradient: string }> = {
  super_admin: { 
    label: "Super Admin", 
    color: "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0",
    icon: Shield,
    gradient: "from-red-500/20 to-rose-500/20"
  },
  admin: { 
    label: "Admin", 
    color: "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0",
    icon: Shield,
    gradient: "from-orange-500/20 to-amber-500/20"
  },
  moderator: { 
    label: "Moderator", 
    color: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0",
    icon: Settings,
    gradient: "from-blue-500/20 to-indigo-500/20"
  },
  content_creator: { 
    label: "Content Creator", 
    color: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
    icon: Sparkles,
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  section_admin: { 
    label: "Section Admin", 
    color: "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0",
    icon: UserCircle,
    gradient: "from-purple-500/20 to-violet-500/20"
  },
  contributor: { 
    label: "Contributor", 
    color: "bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-0",
    icon: Sparkles,
    gradient: "from-cyan-500/20 to-teal-500/20"
  },
}

// Skeleton component for loading states
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-muted rounded-md", className)} />
)

// Profile Skeleton Loader
const ProfileSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-5xl">
    <div className="flex items-center justify-between mb-8">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Profile Card Skeleton */}
      <div className="lg:col-span-1">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5" />
          <CardContent className="pt-0 -mt-12">
            <div className="flex flex-col items-center text-center">
              <Skeleton className="w-24 h-24 rounded-full border-4 border-background" />
              <Skeleton className="h-7 w-40 mt-4" />
              <Skeleton className="h-6 w-28 mt-2" />
              <Skeleton className="h-4 w-48 mt-3" />
              <Skeleton className="h-16 w-full mt-4" />
              <Separator className="my-4 w-full" />
              <div className="w-full space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column Skeleton */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-11 w-28 rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
)

// Social Link Button Component
const SocialLinkButton = ({ 
  href, 
  icon: Icon, 
  label, 
  color 
}: { 
  href: string
  icon: React.ElementType
  label: string
  color: string 
}) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className={cn(
      "group flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300",
      "bg-gradient-to-r hover:shadow-lg hover:scale-105 hover:-translate-y-0.5",
      color
    )}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-medium">{label}</span>
    <ExternalLink className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
  </a>
)

// Info Row Component
const InfoRow = ({ 
  icon: Icon, 
  label, 
  value, 
  isLast = false 
}: { 
  icon: React.ElementType
  label: string
  value: React.ReactNode
  isLast?: boolean 
}) => (
  <div className={cn(
    "flex items-center justify-between py-3.5 transition-colors hover:bg-muted/50 px-3 -mx-3 rounded-lg",
    !isLast && "border-b border-border/50"
  )}>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="text-sm text-muted-foreground">{value}</div>
  </div>
)

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    department: "",
    bio: "",
    avatarUrl: "",
    studentId: "",
    batchId: "",
    socialLinks: {
      github: "",
      linkedin: "",
      twitter: "",
      facebook: "",
      instagram: "",
      website: "",
    }
  })

  // Memoized role info
  const roleInfo = useMemo(() => {
    const defaultRole = { 
      label: profile?.role || "User", 
      color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      icon: User,
      gradient: "from-gray-500/20 to-gray-500/20"
    }
    return roleConfig[profile?.role || ""] || defaultRole
  }, [profile?.role])

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return
      
      if (!authUser) {
        router.push("/login")
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [profileRes, batchesRes] = await Promise.all([
          fetch("/api/user/profile", { credentials: "include" }),
          fetch("/api/batches")
        ])

        const profileData = await profileRes.json()
        const batchesData = await batchesRes.json()

        if (profileData.success) {
          setProfile(profileData.user)
          setFormData({
            fullName: profileData.user.full_name || "",
            phone: profileData.user.phone || "",
            department: profileData.user.department || "",
            bio: profileData.user.bio || "",
            avatarUrl: profileData.user.avatar_url || "",
            studentId: profileData.user.student_id || "",
            batchId: profileData.user.batch_id || "",
            socialLinks: {
              github: profileData.user.social_links?.github || "",
              linkedin: profileData.user.social_links?.linkedin || "",
              twitter: profileData.user.social_links?.twitter || "",
              facebook: profileData.user.social_links?.facebook || "",
              instagram: profileData.user.social_links?.instagram || "",
              website: profileData.user.social_links?.website || "",
            }
          })
        } else {
          setError(profileData.error || "Failed to load profile")
        }

        if (batchesData.success) {
          setBatches(batchesData.batches || [])
        }
      } catch (err) {
        setError("Failed to load profile")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authUser, authLoading, router])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSocialLinkChange = useCallback((platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }))
  }, [])

  // Handle avatar file selection
  const handleAvatarSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    setError(null)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        setAvatarPreview(base64)

        // Upload to server
        try {
          const response = await fetch('/api/user/upload-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ image: base64 })
          })

          const data = await response.json()

          if (data.success) {
            setProfile(prev => prev ? { ...prev, avatar_url: base64 } : null)
            setFormData(prev => ({ ...prev, avatarUrl: base64 }))
            setSuccess('Profile photo uploaded successfully!')
            setImageError(false)
            setTimeout(() => setSuccess(null), 4000)
          } else {
            setError(data.error || 'Failed to upload avatar')
            setAvatarPreview(null)
          }
        } catch (err) {
          setError('Failed to upload avatar')
          setAvatarPreview(null)
          console.error(err)
        } finally {
          setUploadingAvatar(false)
        }
      }
      reader.onerror = () => {
        setError('Failed to read image file')
        setUploadingAvatar(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Failed to process image')
      setUploadingAvatar(false)
      console.error(err)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Remove avatar
  const handleRemoveAvatar = useCallback(async () => {
    setUploadingAvatar(true)
    setError(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatarUrl: null })
      })

      const data = await response.json()

      if (data.success) {
        setProfile(prev => prev ? { ...prev, avatar_url: null } : null)
        setFormData(prev => ({ ...prev, avatarUrl: '' }))
        setAvatarPreview(null)
        setSuccess('Profile photo removed!')
        setTimeout(() => setSuccess(null), 4000)
      } else {
        setError(data.error || 'Failed to remove avatar')
      }
    } catch (err) {
      setError('Failed to remove avatar')
      console.error(err)
    } finally {
      setUploadingAvatar(false)
    }
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone || null,
          department: formData.department || null,
          bio: formData.bio || null,
          avatarUrl: formData.avatarUrl || null,
          studentId: formData.studentId || null,
          batchId: formData.batchId || null,
          socialLinks: formData.socialLinks
        })
      })

      const data = await response.json()

      if (data.success) {
        setProfile(data.user)
        setSuccess("Profile updated successfully!")
        setIsEditing(false)
        setImageError(false)
        setTimeout(() => setSuccess(null), 4000)
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (err) {
      setError("Failed to update profile")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }, [formData])

  const handleCancel = useCallback(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || "",
        phone: profile.phone || "",
        department: profile.department || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatar_url || "",
        studentId: profile.student_id || "",
        batchId: profile.batch_id || "",
        socialLinks: {
          github: profile.social_links?.github || "",
          linkedin: profile.social_links?.linkedin || "",
          twitter: profile.social_links?.twitter || "",
          facebook: profile.social_links?.facebook || "",
          instagram: profile.social_links?.instagram || "",
          website: profile.social_links?.website || "",
        }
      })
    }
    setIsEditing(false)
    setError(null)
    setImageError(false)
    setAvatarPreview(null)
  }, [profile])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }, [])

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [])

  // Social links configuration
  const socialLinksConfig = useMemo(() => [
    { key: 'github', icon: Github, label: 'GitHub', color: 'from-gray-700 to-gray-900 text-white', placeholder: 'https://github.com/username' },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'from-blue-600 to-blue-700 text-white', placeholder: 'https://linkedin.com/in/username' },
    { key: 'facebook', icon: Facebook, label: 'Facebook', color: 'from-blue-500 to-blue-600 text-white', placeholder: 'https://facebook.com/username' },
    { key: 'twitter', icon: Twitter, label: 'Twitter', color: 'from-sky-400 to-sky-500 text-white', placeholder: 'https://twitter.com/username' },
    { key: 'instagram', icon: Instagram, label: 'Instagram', color: 'from-pink-500 via-purple-500 to-orange-400 text-white', placeholder: 'https://instagram.com/username' },
    { key: 'website', icon: Globe, label: 'Website', color: 'from-emerald-500 to-teal-500 text-white', placeholder: 'https://yourwebsite.com' },
  ], [])

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <Header />
        <ProfileSkeleton />
      </div>
    )
  }

  // Not logged in
  if (!authUser) {
    return null
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-2 mb-6 hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/10 flex items-center justify-center mb-6 shadow-lg">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Error Loading Profile</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              {error}
            </p>
            <Button onClick={() => window.location.reload()} size="lg" className="gap-2">
              <Loader2 className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const RoleIcon = roleInfo.icon
  const displayAvatarUrl = avatarPreview || (isEditing ? formData.avatarUrl : profile?.avatar_url)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-2 hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Go Back</span>
          </Button>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                className="gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                size="lg"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={handleCancel}
                  className="gap-2"
                  size="lg"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 shadow-lg">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <span className="font-medium">{success}</span>
          </div>
        )}
        {error && profile && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 shadow-lg">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-b from-card to-card/80">
              {/* Cover gradient */}
              <div className={cn(
                "h-28 bg-gradient-to-br",
                roleInfo.gradient,
                "relative overflow-hidden"
              )}>
                <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
                <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-white/5 blur-3xl" />
              </div>
              
              <CardContent className="pt-0 -mt-14 relative">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="relative mb-4 group">
                    {uploadingAvatar && (
                      <div className="absolute inset-0 w-28 h-28 rounded-full bg-background/80 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    )}
                    {displayAvatarUrl && !imageError ? (
                      <img 
                        src={displayAvatarUrl} 
                        alt={profile?.full_name || "Profile"}
                        className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-2xl ring-4 ring-primary/10 transition-transform group-hover:scale-105"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-background shadow-2xl ring-4 ring-primary/10">
                        <span className="text-3xl font-bold text-primary">
                          {getInitials(profile?.full_name || "U")}
                        </span>
                      </div>
                    )}
                    {isEditing && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 p-2.5 bg-primary rounded-full text-primary-foreground shadow-lg cursor-pointer hover:scale-110 transition-transform disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Name and Role */}
                  {isEditing ? (
                    <Input
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="text-center text-xl font-bold mb-3 bg-muted/50 border-0 h-12"
                      placeholder="Your Name"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {profile?.full_name}
                    </h1>
                  )}
                  
                  <Badge className={cn("mb-3 px-4 py-1.5 text-sm font-semibold shadow-md", roleInfo.color)}>
                    <RoleIcon className="w-3.5 h-3.5 mr-1.5" />
                    {roleInfo.label}
                  </Badge>

                  {profile?.is_approved === false && (
                    <Badge variant="outline" className="mb-3 text-amber-600 border-amber-500/50 bg-amber-500/10">
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Pending Approval
                    </Badge>
                  )}

                  <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {profile?.email}
                  </p>

                  {/* Bio */}
                  {isEditing ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      className="mb-4 bg-muted/50 border-0 resize-none"
                      placeholder="Write a short bio about yourself..."
                      rows={3}
                    />
                  ) : profile?.bio ? (
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed px-2">
                      "{profile.bio}"
                    </p>
                  ) : !isEditing && (
                    <p className="text-muted-foreground/50 text-sm mb-4 italic">
                      No bio added yet
                    </p>
                  )}

                  <Separator className="my-4 w-full" />

                  {/* Info Items */}
                  <div className="w-full space-y-2">
                    {/* Student ID */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <IdCard className="w-3 h-3" /> Student ID
                        </Label>
                        <Input
                          value={formData.studentId}
                          onChange={(e) => handleInputChange("studentId", e.target.value)}
                          placeholder="e.g., 221-15-5001"
                          className="h-10 bg-muted/50 border-0"
                        />
                      </div>
                    ) : profile?.student_id && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IdCard className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Student ID</p>
                          <p className="text-sm font-medium">{profile.student_id}</p>
                        </div>
                      </div>
                    )}

                    {/* Batch */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3" /> Batch
                        </Label>
                        <Select
                          value={formData.batchId}
                          onValueChange={(value) => handleInputChange("batchId", value)}
                        >
                          <SelectTrigger className="h-10 bg-muted/50 border-0">
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((batch) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.batch_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : profile?.batches && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Batch</p>
                          <p className="text-sm font-medium">{profile.batches.batch_name}</p>
                        </div>
                      </div>
                    )}

                    {/* Department */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> Department
                        </Label>
                        <Input
                          value={formData.department}
                          onChange={(e) => handleInputChange("department", e.target.value)}
                          placeholder="e.g., CSE"
                          className="h-10 bg-muted/50 border-0"
                        />
                      </div>
                    ) : profile?.department && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p className="text-sm font-medium">{profile.department}</p>
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> Phone
                        </Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="e.g., +880 1XXX-XXXXXX"
                          className="h-10 bg-muted/50 border-0"
                        />
                      </div>
                    ) : profile?.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{profile.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Join Date - Always visible */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">Member Since</p>
                        <p className="text-sm font-medium">{formatDate(profile?.created_at || "")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Avatar Upload (when editing) */}
            {isEditing && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Profile Picture</CardTitle>
                      <CardDescription>Upload a photo or enter a URL</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Upload Section */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Upload Photo</Label>
                      <div 
                        onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          uploadingAvatar && "opacity-50 cursor-not-allowed",
                          "border-muted-foreground/25"
                        )}
                      >
                        {uploadingAvatar ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <ImagePlus className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Click to upload photo</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                JPG, PNG, GIF or WebP. Max 5MB.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Current avatar preview with remove option */}
                      {displayAvatarUrl && !imageError && (
                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                          <img 
                            src={displayAvatarUrl} 
                            alt="Current avatar"
                            className="w-16 h-16 rounded-full object-cover border-2 border-background"
                            onError={() => setImageError(true)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Current Photo</p>
                            <p className="text-xs text-muted-foreground">Click above to change</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={uploadingAvatar}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted-foreground/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or use URL</span>
                      </div>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Avatar URL</Label>
                      <Input
                        value={formData.avatarUrl}
                        onChange={(e) => {
                          handleInputChange("avatarUrl", e.target.value)
                          setImageError(false)
                          setAvatarPreview(null)
                        }}
                        placeholder="https://example.com/your-photo.jpg"
                        className="h-12 bg-muted/50 border-0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter a direct link to your profile picture (HTTPS URLs only)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Social Links</CardTitle>
                    <CardDescription>
                      {isEditing ? "Add your social media profiles" : "Connect with me on social media"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {socialLinksConfig.map((social) => (
                      <div key={social.key} className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <social.icon className="w-4 h-4" /> {social.label}
                        </Label>
                        <Input
                          value={formData.socialLinks[social.key as keyof typeof formData.socialLinks]}
                          onChange={(e) => handleSocialLinkChange(social.key, e.target.value)}
                          placeholder={social.placeholder}
                          className="h-11 bg-muted/50 border-0"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {socialLinksConfig.map((social) => {
                      const url = profile?.social_links?.[social.key as keyof typeof profile.social_links]
                      if (!url) return null
                      return (
                        <SocialLinkButton
                          key={social.key}
                          href={url}
                          icon={social.icon}
                          label={social.label}
                          color={social.color}
                        />
                      )
                    })}
                    {(!profile?.social_links || Object.values(profile.social_links).every(v => !v)) && (
                      <div className="w-full text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                          <Link2 className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-sm">No social links added yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Click edit to add your social profiles</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Account Information</CardTitle>
                    <CardDescription>Your account details and status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <InfoRow 
                    icon={Mail} 
                    label="Email Address" 
                    value={profile?.email}
                  />
                  <InfoRow 
                    icon={RoleIcon} 
                    label="Account Role" 
                    value={
                      <Badge className={cn("shadow-sm", roleInfo.color)}>
                        {roleInfo.label}
                      </Badge>
                    }
                  />
                  <InfoRow 
                    icon={Check} 
                    label="Account Status" 
                    value={
                      <Badge 
                        className={cn(
                          "shadow-sm",
                          profile?.is_approved 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0" 
                            : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        )}
                      >
                        {profile?.is_approved ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Approved
                          </>
                        ) : (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Pending
                          </>
                        )}
                      </Badge>
                    }
                  />
                  <InfoRow 
                    icon={Calendar} 
                    label="Member Since" 
                    value={formatDate(profile?.created_at || "")}
                    isLast
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
