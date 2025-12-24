import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all sections with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase()
    const departmentId = searchParams.get("departmentId")
    const batchId = searchParams.get("batchId")
    const activeOnly = searchParams.get("activeOnly") !== "false"

    const supabase = createClient()

    let query = supabase
      .from("sections")
      .select(`
        *,
        departments (
          id,
          name,
          short_name
        )
      `)
      .order("order_index", { ascending: true })

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    if (departmentId) {
      query = query.eq("department_id", departmentId)
    }

    if (batchId) {
      query = query.eq("batch_id", batchId)
    }

    const { data: sections, error } = await query

    if (error) {
      console.error("Error fetching sections:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch sections" },
        { status: 500 }
      )
    }

    // Filter by search term if provided
    let filteredSections = sections || []
    if (search && search.trim()) {
      filteredSections = filteredSections.filter(
        (section) =>
          section.name.toLowerCase().includes(search) ||
          section.description?.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      success: true,
      sections: filteredSections
    })
  } catch (error) {
    console.error("Sections GET error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
