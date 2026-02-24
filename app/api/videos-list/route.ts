import { NextResponse } from "next/server"
import { errorResponse, getSupabaseClient } from "@/lib/api-utils"

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("videos")
      .select(`
        id,
        title,
        youtube_url,
        description,
        duration,
        topic:topics (
          id,
          title,
          course:courses (
            id,
            title
          )
        )
      `)
      .limit(10)

    if (error) {
      return errorResponse(`Failed to fetch videos: ${error.message}`, 500, error)
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      videos: data || [],
    })
  } catch (err) {
    return errorResponse(
      "Failed to fetch videos",
      500,
      err instanceof Error ? err.message : "Unknown error"
    )
  }
}
