import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body // 'view' or 'download'

    if (!action || !['view', 'download'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'view' or 'download'" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Find the resource by short ID or full UUID
    const isFullUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const shortIdMatch = id.match(/-([0-9a-f]{8})$/i)

    let resourceId: string | null = null

    if (isFullUUID) {
      resourceId = id
    } else if (shortIdMatch) {
      const shortId = shortIdMatch[1]
      const { data } = await supabase
        .from("study_tools")
        .select("id")
      
      if (data) {
        const found = data.find(item => item.id.startsWith(shortId))
        if (found) resourceId = found.id
      }
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      )
    }

    // Get current count
    const { data: resource, error: fetchError } = await supabase
      .from("study_tools")
      .select("download_count, view_count")
      .eq("id", resourceId)
      .single()

    if (fetchError) {
      console.error("Error fetching resource:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch resource" },
        { status: 500 }
      )
    }

    // Update the appropriate counter
    const updateData: Record<string, number> = {}
    
    if (action === 'download') {
      updateData.download_count = (resource?.download_count || 0) + 1
    } else if (action === 'view') {
      updateData.view_count = (resource?.view_count || 0) + 1
    }

    const { data: updated, error: updateError } = await supabase
      .from("study_tools")
      .update(updateData)
      .eq("id", resourceId)
      .select("download_count, view_count")
      .single()

    if (updateError) {
      console.error("Error updating count:", updateError)
      return NextResponse.json(
        { error: "Failed to update count" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      download_count: updated?.download_count || 0,
      view_count: updated?.view_count || 0
    })
  } catch (error) {
    console.error("Track API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
