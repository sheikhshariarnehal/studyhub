import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Helper function to verify section admin authorization
async function verifySectionAdmin(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value || 
                  request.cookies.get("jwt")?.value || 
                  request.cookies.get("token")?.value

    if (!token) {
      return { error: "No token provided", status: 401 }
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return { error: "Invalid token", status: 401 }
    }

    // Get current user data
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, department, is_active")
      .eq("id", decoded.userId)
      .eq("is_active", true)
      .single()

    if (userError || !adminUser) {
      return { error: "User not found or inactive", status: 401 }
    }

    // Check if user has section admin role or higher
    if (!["section_admin", "admin", "super_admin"].includes(adminUser.role)) {
      return { error: "Insufficient permissions", status: 403 }
    }

    return { user: adminUser }
  } catch (error) {
    console.error("Authorization error:", error)
    return { error: "Internal server error", status: 500 }
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifySectionAdmin(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user!

    // For section admin, filter by their department/section if applicable
    // For now, we'll return all semesters but in production you might want to filter
    let query = supabase
      .from("semesters")
      .select(`
        *,
        courses!inner(count),
        topics:courses(topics!inner(count)),
        study_tools:courses(study_tools!inner(count))
      `)

    // If user is section admin (not super admin), filter by their section/department
    if (user.role === "section_admin" && user.department) {
      query = query.eq("section", user.department)
    }

    const { data: semesters, error } = await query
      .order("is_active", { ascending: false })
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 })
    }

    // Transform the data to include counts
    const transformedSemesters = semesters?.map(semester => {
      const coursesCount = Array.isArray(semester.courses) ? semester.courses.length : 0
      const topicsCount = semester.topics?.reduce((acc: number, course: any) => {
        return acc + (Array.isArray(course.topics) ? course.topics.length : 0)
      }, 0) || 0
      const studyToolsCount = semester.study_tools?.reduce((acc: number, course: any) => {
        return acc + (Array.isArray(course.study_tools) ? course.study_tools.length : 0)
      }, 0) || 0

      return {
        ...semester,
        name: semester.title, // Map title to name for frontend/test compatibility
        year: semester.start_date ? new Date(semester.start_date).getFullYear().toString() : "2025",
        status: semester.is_active ? "active" : "inactive",
        courses_count: coursesCount,
        topics_count: topicsCount,
        study_tools_count: studyToolsCount,
        materials_count: topicsCount + studyToolsCount
      }
    }) || []

    return NextResponse.json(transformedSemesters)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifySectionAdmin(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user!
    const body = await request.json()

    // Support both nested { semester: {...} } and flat {...} payloads
    const semesterData = body.semester || body
    const courses = body.courses || []

    // Validate required fields
    const title = semesterData.title || semesterData.name
    const section = semesterData.section || user.department || "General"

    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title (or name)" },
        { status: 400 }
      )
    }

    // For section admin, ensure they can only create semesters for their section
    if (user.role === "section_admin" && user.department && section !== user.department) {
      return NextResponse.json(
        { error: "You can only create semesters for your assigned section" },
        { status: 403 }
      )
    }

    // Start a transaction to create semester and courses
    const { data: newSemester, error: semesterError } = await supabase
      .from("semesters")
      .insert({
        title: title,
        description: semesterData.description || "",
        section: section,
        has_midterm: semesterData.has_midterm ?? true,
        has_final: semesterData.has_final ?? true,
        start_date: semesterData.start_date || null,
        end_date: semesterData.end_date || null,
        default_credits: semesterData.default_credits || 3,
        is_active: semesterData.is_active ?? true,
        created_by: user.id
      })
      .select()
      .single()

    if (semesterError) {
      console.error("Error creating semester:", semesterError)
      return NextResponse.json(
        { error: "Failed to create semester" },
        { status: 500 }
      )
    }

    // Create courses if provided
    if (courses.length > 0) {
      const coursesToInsert = courses.map((course: any) => ({
        semester_id: newSemester.id,
        title: course.title,
        course_code: course.course_code,
        teacher_name: course.teacher_name,
        teacher_email: course.teacher_email || null,
        credits: course.credits || semester.default_credits || 3,
        description: course.description || "",
        is_highlighted: course.is_highlighted || false
      }))

      const { data: newCourses, error: coursesError } = await supabase
        .from("courses")
        .insert(coursesToInsert)
        .select()

      if (coursesError) {
        console.error("Error creating courses:", coursesError)
        // Note: In production, you might want to rollback the semester creation
      }

      // Create topics and study tools for each course
      for (const [index, course] of courses.entries()) {
        if (newCourses && newCourses[index]) {
          const courseId = newCourses[index].id

          // Create topics
          if (course.topics && course.topics.length > 0) {
            const topicsToInsert = course.topics.map((topic: any, topicIndex: number) => ({
              course_id: courseId,
              title: topic.title,
              description: topic.description || "",
              order_index: topic.order_index ?? topicIndex
            }))

            const { data: newTopics, error: topicsError } = await supabase
              .from("topics")
              .insert(topicsToInsert)
              .select()

            if (!topicsError && newTopics) {
              // Create slides and videos for each topic
              for (const [topicIndex, topic] of course.topics.entries()) {
                const topicId = newTopics[topicIndex]?.id

                if (topicId) {
                  // Create slides
                  if (topic.slides && topic.slides.length > 0) {
                    const slidesToInsert = topic.slides.map((slide: any) => ({
                      topic_id: topicId,
                      title: slide.title,
                      url: slide.url,
                      description: slide.description || ""
                    }))

                    await supabase.from("slides").insert(slidesToInsert)
                  }

                  // Create videos
                  if (topic.videos && topic.videos.length > 0) {
                    const videosToInsert = topic.videos.map((video: any) => ({
                      topic_id: topicId,
                      title: video.title,
                      url: video.url,
                      description: video.description || ""
                    }))

                    await supabase.from("videos").insert(videosToInsert)
                  }
                }
              }
            }
          }

          // Create study tools
          if (course.studyTools && course.studyTools.length > 0) {
            const studyToolsToInsert = course.studyTools.map((tool: any) => ({
              course_id: courseId,
              title: tool.title,
              type: tool.type,
              content_url: tool.content_url,
              exam_type: tool.exam_type,
              description: tool.description || ""
            }))

            await supabase.from("study_tools").insert(studyToolsToInsert)
          }
        }
      }
    }

    // Map title to name for frontend/test compatibility
    const responseSemester = {
      ...newSemester,
      name: newSemester.title,
      year: newSemester.start_date ? new Date(newSemester.start_date).getFullYear().toString() : "2025",
      status: newSemester.is_active ? "active" : "inactive"
    }

    return NextResponse.json(responseSemester, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
