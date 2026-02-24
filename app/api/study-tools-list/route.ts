import { NextResponse } from "next/server"
import { errorResponse, getSupabaseClient } from "@/lib/api-utils"

export async function GET() {
  try {
    const supabase = getSupabaseClient()

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
      .limit(10)

    if (error) {
      return errorResponse(`Failed to fetch study tools: ${error.message}`, 500, error)
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      studyTools: data || [],
    })
  } catch (err) {
    return errorResponse(
      "Failed to fetch study tools",
      500,
      err instanceof Error ? err.message : "Unknown error"
    )
  }
}
