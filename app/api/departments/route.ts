import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all departments with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase()
    const activeOnly = searchParams.get("activeOnly") !== "false"

    const supabase = createClient()

    let query = supabase
      .from("departments")
      .select("*")
      .order("order_index", { ascending: true })

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data: departments, error } = await query

    if (error) {
      console.error("Error fetching departments:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch departments" },
        { status: 500 }
      )
    }

    // Filter by search term if provided
    let filteredDepartments = departments || []
    if (search && search.trim()) {
      filteredDepartments = filteredDepartments.filter(
        (dept) =>
          dept.name.toLowerCase().includes(search) ||
          dept.short_name.toLowerCase().includes(search) ||
          dept.faculty?.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      success: true,
      departments: filteredDepartments
    })
  } catch (error) {
    console.error("Departments GET error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
