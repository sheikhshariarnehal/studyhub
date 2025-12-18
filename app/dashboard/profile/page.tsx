"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { compressImage, validateImageFile } from "@/lib/image-compression"
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Save,
  Loader2,
  Camera,
  Globe,
  Github,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Check,
  AlertCircle,
  ChevronDown,
  ArrowLeft,
  Upload,
  Trash2,
} from "lucide-react"
import Link from "next/link"

interface Batch {
  id: string
  batch_number: number
  batch_name: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  social_links: Record<string, string> | null
  student_id: string | null
  batch_id: string | null
  is_approved: boolean
  created_at: string
  updated_at: string
  batches: Batch | null
}

export default function DashboardProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)

  // Form state
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
  const [studentId, setStudentId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    github: "",
    facebook: "",
    twitter: "",
    instagram: "",
    website: "",
  })

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file, 10)
    if (!validation.valid) {
      setError(validation.error || "Invalid file")
      return
    }

    setIsUploadingAvatar(true)
    setError("")
    setSuccess("")

    try {
      // Compress image to low resolution (400x400, 70% quality)
      const compressedImage = await compressImage(file, 400, 400, 0.7)

      // Upload to server
      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedImage }),
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setAvatarUrl(compressedImage)
        setSuccess("Profile picture updated successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to upload image")
      }
    } catch (err) {
      console.error("Image upload error:", err)
      setError("Failed to upload image. Please try again.")
    } finally {
      setIsUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handle remove avatar
  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return
    }

    setIsUploadingAvatar(true)
    setError("")

    try {
      const response = await fetch("/api/user/upload-avatar", {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setAvatarUrl("")
        setSuccess("Profile picture removed successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to remove image")
      }
    } catch (err) {
      console.error("Remove avatar error:", err)
      setError("Failed to remove image. Please try again.")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include",
        })
        const data = await response.json()

        if (data.success) {
          const p = data.user as UserProfile
          setProfile(p)
          setFullName(p.full_name || "")
          setPhone(p.phone || "")
          setDepartment(p.department || "")
          setStudentId(p.student_id || "")
          setBatchId(p.batch_id || "")
          setBio(p.bio || "")
          setAvatarUrl(p.avatar_url || "")
          setSocialLinks({
            linkedin: p.social_links?.linkedin || "",
            github: p.social_links?.github || "",
            facebook: p.social_links?.facebook || "",
            twitter: p.social_links?.twitter || "",
            instagram: p.social_links?.instagram || "",
            website: p.social_links?.website || "",
          })
        } else {
          setError("Failed to load profile")
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch("/api/batches")
        const data = await response.json()
        if (data.success) {
          setBatches(data.batches)
        }
      } catch (err) {
        console.error("Error fetching batches:", err)
      }
    }
    fetchBatches()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSaving(true)

    try {
      // Clean up social links - remove empty values
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([, value]) => value.trim() !== "")
      )

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName,
          phone: phone || null,
          department: department || null,
          studentId: studentId || null,
          batchId: batchId || null,
          bio: bio || null,
          avatarUrl: avatarUrl || null,
          socialLinks: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Profile updated successfully!")
        setProfile(data.user)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const selectedBatch = batches.find((b) => b.id === batchId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load profile. Please try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your personal information and preferences
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            profile.is_approved
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-yellow-100 text-yellow-800 border-yellow-300"
          }
        >
          {profile.is_approved ? "Approved" : "Pending Approval"}
        </Badge>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-300">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Your personal information and profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg">
                    <span className="text-2xl font-bold text-primary">
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 p-1 bg-primary rounded-full">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a square image (recommended 400x400px). Images are automatically compressed.
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Or paste image URL</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://example.com/your-photo.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Name & Email */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>

            {/* Phone & Department */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+880 1XXX-XXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Department
                </Label>
                <Input
                  id="department"
                  placeholder="e.g., Computer Science & Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            {/* Student ID & Batch */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  placeholder="e.g., 221-15-XXXX"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Batch
                </Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                    className="w-full px-3 py-2 border border-input rounded-md text-left flex items-center justify-between bg-background hover:bg-accent transition-colors"
                  >
                    <span className={selectedBatch ? "text-foreground" : "text-muted-foreground"}>
                      {selectedBatch ? selectedBatch.batch_name : "Select your batch"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {showBatchDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setBatchId("")
                          setShowBatchDropdown(false)
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-accent text-muted-foreground"
                      >
                        No batch selected
                      </button>
                      {batches.map((batch) => (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() => {
                            setBatchId(batch.id)
                            setShowBatchDropdown(false)
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-accent ${
                            batchId === batch.id ? "bg-primary/10 text-primary" : ""
                          }`}
                        >
                          {batch.batch_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle>About Me</CardTitle>
            <CardDescription>Write a short bio about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Tell us about yourself, your interests, and what you're studying..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {bio.length}/500 characters
            </p>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Links
            </CardTitle>
            <CardDescription>Connect your social media profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-[#0077B5]" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={socialLinks.linkedin}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, linkedin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </Label>
                <Input
                  id="github"
                  type="url"
                  placeholder="https://github.com/username"
                  value={socialLinks.github}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, github: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  type="url"
                  placeholder="https://facebook.com/username"
                  value={socialLinks.facebook}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, facebook: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  Twitter / X
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  placeholder="https://twitter.com/username"
                  value={socialLinks.twitter}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, twitter: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-[#E4405F]" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/username"
                  value={socialLinks.instagram}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, instagram: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Personal Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={socialLinks.website}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, website: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="secondary" className="capitalize">
                  {profile.role.replace("_", " ")}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="text-sm font-medium">
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {new Date(profile.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
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
        </div>
      </form>
    </div>
  )
}
