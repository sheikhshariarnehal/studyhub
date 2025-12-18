import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getAuthUser, isContributor } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

// Helper to check if contributor owns the course
async function checkCourseOwnership(supabase: any, courseId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("courses")
    .select("created_by")
    .eq("id", courseId)
    .single()
  
  return data?.created_by === userId
}

// GET - Fetch a single course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(request)
    const supabase = createClient()

    const { data: course, error } = await supabase
      .from("courses")
      .select(`
        *,
        semester:semesters (
          id,
          title,
          section
        ),
        topics (
          id,
          title
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      )
    }

    // Contributors can only view their own courses
    if (user && isContributor(user) && course.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      course
    })
  } catch (error) {
    console.error("Course GET error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update a course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Contributors can only update their own courses
    if (isContributor(user)) {
      const isOwner = await checkCourseOwnership(supabase, id, user.id)
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: "Access denied - You can only edit your own courses" },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { 
      title, 
      course_code, 
      teacher_name, 
      teacher_email,
      description,
      credits,
      is_active,
      is_highlighted
    } = body

    // Build update object
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    
    if (title !== undefined) updateData.title = title
    if (course_code !== undefined) updateData.course_code = course_code
    if (teacher_name !== undefined) updateData.teacher_name = teacher_name
    if (teacher_email !== undefined) updateData.teacher_email = teacher_email
    if (description !== undefined) updateData.description = description
    if (credits !== undefined) updateData.credits = credits
    if (is_active !== undefined) updateData.is_active = is_active
    if (is_highlighted !== undefined) updateData.is_highlighted = is_highlighted

    const { data: course, error } = await supabase
      .from("courses")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        semester:semesters (
          id,
          title,
          section
        )
      `)
      .single()

    if (error) {
      console.error("Error updating course:", error)
      return NextResponse.json(
        { success: false, error: "Failed to update course", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course
    })
  } catch (error) {
    console.error("Course PUT error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Contributors can only delete their own courses
    if (isContributor(user)) {
      const isOwner = await checkCourseOwnership(supabase, id, user.id)
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: "Access denied - You can only delete your own courses" },
          { status: 403 }
        )
      }
    }

    // Check for related topics
    const { count: topicsCount } = await supabase
      .from("topics")
      .select("id", { count: 'exact', head: true })
      .eq("course_id", id)

    if (topicsCount && topicsCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete course with ${topicsCount} associated topics. Please delete topics first.` },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting course:", error)
      return NextResponse.json(
        { success: false, error: "Failed to delete course", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully"
    })
  } catch (error) {
    console.error("Course DELETE error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
