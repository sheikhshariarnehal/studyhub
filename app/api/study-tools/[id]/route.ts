import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[study-tools] Fetching study tool with ID:", id)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("study_tools")
      .select(`
        id,
        title,
        type,
        content_url,
        exam_type,
        created_at,
        updated_at,
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

    console.log("[study-tools] Query result:", { data, error })

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Study tool not found" }, { status: 404 })
      }
      console.error("[study-tools] GET error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data for consistent API response
    const courseData = Array.isArray(data.course) ? data.course[0] : data.course as any;
    const semesterData = courseData?.semester ? 
      (Array.isArray(courseData.semester) ? courseData.semester[0] : courseData.semester) : null;

    const transformedData = {
      id: data.id,
      title: data.title,
      url: data.content_url,
      type: "study-tool",
      studyToolType: data.type,
      examType: data.exam_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      course: courseData ? {
        id: courseData.id,
        title: courseData.title,
        courseCode: courseData.course_code,
        course_code: courseData.course_code, // Also include snake_case for compatibility
        teacherName: courseData.teacher_name,
        semester: semesterData ? {
          id: semesterData.id,
          title: semesterData.title,
          section: semesterData.section,
          name: semesterData.title
        } : null
      } : null,
      // SEO and sharing metadata
      metadata: {
        title: courseData?.title ? `${data.title} - ${courseData.title}` : data.title,
        description: `${data.type.replace('_', ' ').toUpperCase()}${courseData?.title ? ` for ${courseData.title} course` : ''}`,
        courseTitle: courseData?.title || null,
        semesterTitle: semesterData?.title || null,
        teacherName: courseData?.teacher_name || null,
        studyToolType: data.type,
        examType: data.exam_type,
        shareUrl: `/study-tool/${data.id}`,
        embedUrl: data.content_url
      }
    }

    return NextResponse.json(transformedData)
  } catch (err) {
    console.error("[study-tools] GET error:", err)
    return NextResponse.json({ error: "Failed to fetch study tool" }, { status: 500 })
  }
}
