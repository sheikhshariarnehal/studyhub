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

    // Try to fetch by ID first
    let query = supabase
      .from("study_tools")
      .select(`
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
      `)

    // Check if id is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    if (isUUID) {
      query = query.eq("id", id)
    } else {
      // Try to find by title slug
      const decodedSlug = decodeURIComponent(id).replace(/-/g, " ")
      query = query.ilike("title", `%${decodedSlug}%`)
    }

    const { data: resource, error } = await query.single()

    if (error) {
      console.error("Error fetching resource:", error)
      
      // If single() failed, try to get the first match
      if (!isUUID) {
        const decodedSlug = decodeURIComponent(id).replace(/-/g, " ")
        const { data: resources, error: listError } = await supabase
          .from("study_tools")
          .select(`
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
          `)
          .ilike("title", `%${decodedSlug}%`)
          .limit(1)

        if (!listError && resources && resources.length > 0) {
          return NextResponse.json({
            success: true,
            resource: resources[0]
          })
        }
      }

      return NextResponse.json(
        { error: "Resource not found", details: error.message },
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
