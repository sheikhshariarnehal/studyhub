import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"
import { getAuthUser, isContributor } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

// Helper to check if contributor owns the resource
async function checkResourceOwnership(supabase: any, resourceId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("study_tools")
    .select("created_by")
    .eq("id", resourceId)
    .single()
  
  return data?.created_by === userId
}

// GET - Fetch a single resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(request)
    const supabase = createClient()

    const { data: resource, error } = await supabase
      .from("study_tools")
      .select(`
        *,
        course:courses (
          id,
          title,
          course_code,
          teacher_name,
          semester:semesters (
            id,
            title,
            section
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching resource:", error)
      return NextResponse.json(
        { error: "Resource not found", details: error.message },
        { status: 404 }
      )
    }

    // Contributors can only view their own resources
    if (user && isContributor(user) && resource.created_by !== user.id) {
      return NextResponse.json(
        { error: "Access denied - You can only view your own resources" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      resource
    })
  } catch (error) {
    console.error("Admin resource GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update a resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Contributors can only update their own resources
    if (isContributor(user)) {
      const isOwner = await checkResourceOwnership(supabase, id, user.id)
      if (!isOwner) {
        return NextResponse.json(
          { error: "Access denied - You can only edit your own resources" },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      type, 
      content_url, 
      course_id,
      course_name,
      semester_id,
      semester_name, 
      exam_type,
      file_format,
      file_size_mb,
      academic_year,
      is_downloadable
    } = body

    // Build update object with only provided fields
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (content_url !== undefined) updateData.content_url = content_url
    if (course_id !== undefined) updateData.course_id = course_id
    if (course_name !== undefined) updateData.course_name = course_name
    if (semester_id !== undefined) updateData.semester_id = semester_id
    if (semester_name !== undefined) updateData.semester_name = semester_name
    if (exam_type !== undefined) updateData.exam_type = exam_type
    if (file_format !== undefined) updateData.file_format = file_format
    if (file_size_mb !== undefined) updateData.file_size_mb = file_size_mb
    if (academic_year !== undefined) updateData.academic_year = academic_year
    if (is_downloadable !== undefined) updateData.is_downloadable = is_downloadable

    const { data: resource, error } = await supabase
      .from("study_tools")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        course:courses (
          id,
          title,
          course_code,
          teacher_name,
          semester:semesters (
            id,
            title,
            section
          )
        )
      `)
      .single()

    if (error) {
      console.error("Error updating resource:", error)
      return NextResponse.json(
        { error: "Failed to update resource", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resource
    })
  } catch (error) {
    console.error("Admin resource PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Contributors can only delete their own resources
    if (isContributor(user)) {
      const isOwner = await checkResourceOwnership(supabase, id, user.id)
      if (!isOwner) {
        return NextResponse.json(
          { error: "Access denied - You can only delete your own resources" },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from("study_tools")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting resource:", error)
      return NextResponse.json(
        { error: "Failed to delete resource", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully"
    })
  } catch (error) {
    console.error("Admin resource DELETE error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
