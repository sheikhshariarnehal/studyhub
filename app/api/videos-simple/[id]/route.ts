import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log("Videos API called with ID:", id)

  try {
    console.log("Creating Supabase client...")

    const supabase = createClient()
    console.log("Supabase client created successfully")

    console.log("Querying videos table...")
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, youtube_url, description")
      .eq("id", id)
      .single()

    console.log("Query result:", { data, error })

    if (error) {
      console.error("Supabase error:", error)
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Video not found" }, { status: 404 })
      }
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error
      }, { status: 500 })
    }

    if (!data) {
      console.log("No data returned")
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    console.log("Returning video data:", data)

    // Simple response format
    const response = {
      id: data.id,
      title: data.title,
      url: data.youtube_url,
      description: data.description,
      type: "video"
    }

    return NextResponse.json(response)

  } catch (err) {
    console.error("API Error:", err)
    return NextResponse.json({
      error: "Failed to fetch video",
      details: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'No stack trace'
    }, { status: 500 })
  }
}
