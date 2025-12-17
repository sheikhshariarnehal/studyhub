import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId } = body

    if (!noteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Note ID is required"
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // First, get current download count
    const { data: currentData, error: fetchError } = await supabase
      .from("study_tools")
      .select("download_count")
      .eq("id", noteId)
      .eq("type", "exam_note")
      .single()

    if (fetchError) {
      console.error("Error fetching note:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Note not found"
        },
        { status: 404 }
      )
    }

    const newCount = (currentData?.download_count || 0) + 1

    // Increment the download count
    const { data, error } = await supabase
      .from("study_tools")
      .update({ 
        download_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", noteId)
      .eq("type", "exam_note")
      .select("download_count")
      .single()

    if (error) {
      console.error("Error updating download count:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update download count"
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      download_count: data?.download_count || 0
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    )
  }
}
