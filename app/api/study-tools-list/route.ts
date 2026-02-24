import { NextResponse } from "next/server"
import { errorResponse, getSupabaseClient } from "@/lib/api-utils"

export const revalidate = 60

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const offset = (page - 1) * limit

    const { count } = await supabase
      .from("study_tools")
      .select("*", { count: "exact", head: true })

    const { data, error } = await supabase
      .from("study_tools")
      .select(`
        id,
        title,
        content_url,
        type,
        course:courses (
          id,
          title
        )
      `)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false })

    if (error) {
      return errorResponse(`Failed to fetch study tools: ${error.message}`, 500, error)
    }

    const total = count ?? 0

    return NextResponse.json(
      {
        success: true,
        count: data?.length || 0,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        studyTools: data || [],
      },
      { headers: CACHE_HEADERS }
    )
  } catch (err) {
    return errorResponse(
      "Failed to fetch study tools",
      500,
      err instanceof Error ? err.message : "Unknown error"
    )
  }
}
