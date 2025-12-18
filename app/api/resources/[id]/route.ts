import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    // Base select query
    const selectQuery = `
      *,
      course:courses (
        id,
        title,
        course_code,
        teacher_name,
        description,
        credits,
        semester:semesters (
          id,
          title,
          section
        )
      )
    `

    // Check if id is a full UUID
    const isFullUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    // Check if id ends with a short UUID (8 chars) - format: title-slug-shortid
    const shortIdMatch = id.match(/-([0-9a-f]{8})$/i)
    
    let resource = null
    let error = null

    if (isFullUUID) {
      // Direct UUID lookup
      const result = await supabase
        .from("study_tools")
        .select(selectQuery)
        .eq("id", id)
        .single()
      resource = result.data
      error = result.error
    } else if (shortIdMatch) {
      // Extract short ID and construct the UUID pattern to search
      const shortId = shortIdMatch[1]
      
      // Fetch all study_tools and filter by ID prefix (workaround for UUID type)
      const result = await supabase
        .from("study_tools")
        .select(selectQuery)
      
      if (result.data) {
        resource = result.data.find(item => item.id.startsWith(shortId))
      }
      error = result.error
    } else {
      // Fallback: try to find by title slug
      const decodedSlug = decodeURIComponent(id).replace(/-/g, " ")
      const result = await supabase
        .from("study_tools")
        .select(selectQuery)
        .ilike("title", `%${decodedSlug}%`)
        .limit(1)
      resource = result.data?.[0]
      error = result.error
    }

    if (error || !resource) {
      console.error("Error fetching resource:", error)
      return NextResponse.json(
        { error: "Resource not found", details: error?.message },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      resource
    })
  } catch (error) {
    console.error("Resource API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
