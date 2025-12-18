import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// GET - Fetch public user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    // Fetch user profile (only public fields)
    const { data: user, error } = await supabase
      .from("admin_users")
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        bio,
        social_links,
        batch_id,
        role,
        created_at,
        batch:batches (
          id,
          batch_name
        )
      `)
      .eq("id", id)
      .single()

    if (error || !user) {
      console.error("Error fetching user:", error)
      return NextResponse.json(
        { error: "User not found", details: error?.message },
        { status: 404 }
      )
    }

    // Fetch resources created by this user
    const { data: resources, count: resourceCount } = await supabase
      .from("study_tools")
      .select("id, title, type, created_at", { count: "exact" })
      .eq("created_by", id)
      .order("created_at", { ascending: false })
      .limit(10)

    // Fetch semesters created by this user
    const { count: semesterCount } = await supabase
      .from("semesters")
      .select("id", { count: "exact", head: true })
      .eq("created_by", id)

    // Fetch courses created by this user
    const { count: courseCount } = await supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("created_by", id)

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        // Hide email for privacy (only show first part)
        email: user.email ? `${user.email.split("@")[0]}@***` : null
      },
      stats: {
        resources: resourceCount || 0,
        semesters: semesterCount || 0,
        courses: courseCount || 0
      },
      recentResources: resources || []
    })
  } catch (error) {
    console.error("Public profile API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
