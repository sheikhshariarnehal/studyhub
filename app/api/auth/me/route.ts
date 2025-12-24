import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Disable caching for this route - critical for auth
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      )
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Get current user data
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, department, phone, is_active, is_approved, last_login, created_at, updated_at")
      .eq("id", decoded.userId)
      .eq("is_active", true)
      .single()

    if (userError || !adminUser) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 401 }
      )
    }

    // Check if session is still valid
    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("expires_at, is_active")
      .eq("user_id", decoded.userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !session || !session.is_active) {
      return NextResponse.json(
        { success: false, error: "Session not found or expired" },
        { status: 401 }
      )
    }

    // Check if session has expired
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    
    if (now > expiresAt) {
      // Mark session as inactive
      await supabase
        .from("admin_sessions")
        .update({ is_active: false })
        .eq("user_id", decoded.userId)

      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      user: adminUser
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error("Session validation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
