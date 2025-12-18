import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("admin_token")?.value
    
    if (!token) {
      console.error("No token provided")
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token" },
        { status: 401 }
      )
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError)
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      )
    }
    
    const userId = decoded.userId
    console.log("Uploading avatar for user:", userId)

    // Get the base64 image from request body
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      )
    }

    // Validate base64 format
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: "Invalid image format - must be data:image/" },
        { status: 400 }
      )
    }

    // Check file size (base64 is roughly 1.33x the original size)
    const base64Length = image.length - (image.indexOf(',') + 1)
    const fileSize = (base64Length * 3) / 4
    
    console.log("Image size:", fileSize, "bytes")
    
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Image size too large (${Math.round(fileSize / 1024 / 1024)}MB). Maximum 5MB allowed.` },
        { status: 400 }
      )
    }

    // Update user avatar in database
    const supabase = createClient()
    
    console.log("Updating avatar in database for user ID:", userId)
    
    const { data: user, error } = await supabase
      .from("admin_users")
      .update({ 
        avatar_url: image,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select("id, full_name, email, avatar_url")
      .single()

    if (error) {
      console.error("Database error updating avatar:", error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log("Avatar updated successfully for user:", user?.full_name)

    return NextResponse.json({
      success: true,
      user,
      message: "Avatar updated successfully"
    })

  } catch (error) {
    console.error("Upload avatar error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const userId = decoded.userId

    const supabase = createClient()
    
    const { error } = await supabase
      .from("admin_users")
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)

    if (error) {
      console.error("Error removing avatar:", error)
      return NextResponse.json(
        { success: false, error: "Failed to remove avatar" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully"
    })

  } catch (error) {
    console.error("Remove avatar error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
