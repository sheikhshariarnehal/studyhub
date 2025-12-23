import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Disable caching for this route - critical for auth
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const supabase = createClient()

        // Invalidate session in database
        await supabase
          .from("admin_sessions")
          .update({ is_active: false })
          .eq("user_id", decoded.userId)

      } catch (error) {
        console.error("Error invalidating session:", error)
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    })

    // Clear all auth cookies
    const isProd = process.env.NODE_ENV === "production"
    const clearOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? "none" : "lax") as any,
      maxAge: 0,
      path: "/"
    }

    cookieStore.set("admin_token", "", clearOptions)
    cookieStore.set("jwt", "", clearOptions)
    cookieStore.set("token", "", clearOptions)

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
