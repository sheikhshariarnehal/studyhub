import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // First try with all columns including new ones
    let { data: user, error } = await supabase
      .from("admin_users")
      .select(`
        id,
        full_name,
        email,
        role,
        department,
        department_id,
        section_id,
        phone,
        bio,
        avatar_url,
        social_links,
        student_id,
        batch_id,
        is_approved,
        created_at,
        updated_at
      `)
      .eq("id", userId)
      .single()

    // If error (likely missing columns), try with basic columns only
    if (error) {
      console.log("Trying basic query without new columns...")
      const { data: basicUser, error: basicError } = await supabase
        .from("admin_users")
        .select(`
          id,
          full_name,
          email,
          role,
          department,
          phone,
          is_approved,
          created_at,
          updated_at
        `)
        .eq("id", userId)
        .single()
      
      if (basicError || !basicUser) {
        console.error("Error fetching user:", basicError)
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        )
      }

      // Return basic user with null values for missing fields
      return NextResponse.json({
        success: true,
        user: {
          ...basicUser,
          bio: null,
          avatar_url: null,
          social_links: null,
          student_id: null,
          batch_id: null,
          department_id: null,
          section_id: null,
          batches: null,
          departments: null,
          sections: null
        }
      })
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Fetch related data separately if IDs exist
    let batch = null
    let departmentData = null
    let section = null

    if (user.batch_id) {
      const { data } = await supabase
        .from("batches")
        .select("id, batch_number, batch_name")
        .eq("id", user.batch_id)
        .single()
      batch = data
    }

    if (user.department_id) {
      const { data } = await supabase
        .from("departments")
        .select("id, name, short_name")
        .eq("id", user.department_id)
        .single()
      departmentData = data
    }

    if (user.section_id) {
      const { data } = await supabase
        .from("sections")
        .select("id, name")
        .eq("id", user.section_id)
        .single()
      section = data
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        batches: batch,
        departments: departmentData,
        sections: section
      }
    })

  } catch (error) {
    console.error("Profile GET error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      fullName, 
      phone, 
      department,
      departmentId,
      sectionId,
      bio, 
      avatarUrl, 
      socialLinks,
      studentId,
      batchId 
    } = body

    const supabase = createClient()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (fullName !== undefined) updateData.full_name = fullName.trim()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (department !== undefined) updateData.department = department?.trim() || null
    if (departmentId !== undefined) updateData.department_id = departmentId || null
    if (sectionId !== undefined) updateData.section_id = sectionId || null
    if (bio !== undefined) updateData.bio = bio?.trim() || null
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl?.trim() || null
    if (socialLinks !== undefined) updateData.social_links = socialLinks || {}
    if (studentId !== undefined) updateData.student_id = studentId?.trim() || null
    if (batchId !== undefined) updateData.batch_id = batchId || null

    // Validate avatar URL if provided (allow http/https URLs or base64 data URIs)
    if (avatarUrl && avatarUrl.trim()) {
      const urlRegex = /^https?:\/\/.*/i
      const base64Regex = /^data:image\/.*/i
      if (!urlRegex.test(avatarUrl) && !base64Regex.test(avatarUrl)) {
        return NextResponse.json(
          { success: false, error: "Invalid avatar URL format. Must be http/https URL or base64 data URI" },
          { status: 400 }
        )
      }
    }

    // Validate social links structure
    if (socialLinks) {
      const validPlatforms = ['linkedin', 'github', 'facebook', 'twitter', 'instagram', 'website']
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url && typeof url === 'string' && url.trim()) {
          if (!validPlatforms.includes(platform)) {
            return NextResponse.json(
              { success: false, error: `Invalid social platform: ${platform}` },
              { status: 400 }
            )
          }
          const urlRegex = /^https?:\/\/.*/i
          if (!urlRegex.test(url as string)) {
            return NextResponse.json(
              { success: false, error: `Invalid URL for ${platform}` },
              { status: 400 }
            )
          }
        }
      }
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("admin_users")
      .update(updateData)
      .eq("id", userId)
      .select(`
        id,
        full_name,
        email,
        role,
        department,
        department_id,
        section_id,
        phone,
        bio,
        avatar_url,
        social_links,
        student_id,
        batch_id,
        is_approved,
        created_at,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 }
      )
    }

    // Fetch related data separately if IDs exist
    let batch = null
    let departmentData = null
    let section = null

    if (updatedUser.batch_id) {
      const { data } = await supabase
        .from("batches")
        .select("id, batch_number, batch_name")
        .eq("id", updatedUser.batch_id)
        .single()
      batch = data
    }

    if (updatedUser.department_id) {
      const { data } = await supabase
        .from("departments")
        .select("id, name, short_name")
        .eq("id", updatedUser.department_id)
        .single()
      departmentData = data
    }

    if (updatedUser.section_id) {
      const { data } = await supabase
        .from("sections")
        .select("id, name")
        .eq("id", updatedUser.section_id)
        .single()
      section = data
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        batches: batch,
        departments: departmentData,
        sections: section
      }
    })

  } catch (error) {
    console.error("Profile PUT error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
