import { NextResponse, type NextRequest } from "next/server"
import { createDB } from "@/lib/supabase"
import { getAuthUser, isContributor } from "@/lib/auth-utils"

interface SemesterData {
  title: string
  description: string
  section: string
  has_midterm: boolean
  has_final: boolean
  start_date?: string
  end_date?: string
  credits?: number
}

interface CourseData {
  title: string
  course_code: string
  teacher_name: string
  teacher_email?: string
  credits?: number
  description?: string
  is_highlighted?: boolean
  topics: TopicData[]
  studyTools: StudyToolData[]
}

interface TopicData {
  title: string
  description: string
  order_index?: number
  slides: { title: string; url: string; description?: string }[]
  videos: { title: string; url: string; description?: string }[]
}

interface StudyToolData {
  title: string
  type: string
  content_url: string
  exam_type: string
  description?: string
}

interface AllInOneData {
  semester: SemesterData
  courses: CourseData[]
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      )
    }

    // Check if user is approved (for contributors)
    if (isContributor(user) && !user.is_approved) {
      return NextResponse.json(
        { error: "Your account is pending approval" },
        { status: 403 }
      )
    }

    const data: AllInOneData = await request.json()
    const db = createDB()

    // Validate required fields
    if (!data.semester.title || !data.semester.section) {
      return NextResponse.json(
        { error: "Semester title and section are required" },
        { status: 400 }
      )
    }

    if (!data.courses || data.courses.length === 0) {
      return NextResponse.json(
        { error: "At least one course is required" },
        { status: 400 }
      )
    }

    // Validate courses
    for (const course of data.courses) {
      if (!course.title || !course.course_code || !course.teacher_name) {
        return NextResponse.json(
          { error: "Course title, code, and teacher name are required" },
          { status: 400 }
        )
      }
    }

    // Start transaction-like operations
    // Create semester first
    const semesterInsertData = {
      title: data.semester.title,
      description: data.semester.description,
      section: data.semester.section,
      has_midterm: data.semester.has_midterm,
      has_final: data.semester.has_final,
      created_by: user.id
    }

    const { data: semesterData, error: semesterError } = await db
      .from("semesters")
      .insert([semesterInsertData])
      .select()
      .single()

    if (semesterError) {
      return NextResponse.json(
        { error: `Failed to create semester: ${semesterError.message}` },
        { status: 500 }
      )
    }

    const createdCourses = []

    // Create courses and their content
    for (const course of data.courses) {
      try {
        // Create course
        const courseInsertData = {
          title: course.title,
          course_code: course.course_code,
          teacher_name: course.teacher_name,
          teacher_email: course.teacher_email || null,
          credits: course.credits || 3,
          description: course.description || null,
          is_highlighted: course.is_highlighted || false,
          semester_id: semesterData.id,
          created_by: user.id
        }

        const { data: courseData, error: courseError } = await db
          .from("courses")
          .insert([courseInsertData])
          .select()
          .single()

        if (courseError) throw courseError

        const createdTopics = []

        // Create topics for this course
        for (let topicIndex = 0; topicIndex < course.topics.length; topicIndex++) {
          const topic = course.topics[topicIndex]
          
          if (!topic.title) continue // Skip topics without titles

          const { data: topicData, error: topicError } = await db
            .from("topics")
            .insert([{
              title: topic.title,
              description: topic.description || "",
              course_id: courseData.id,
              order_index: topic.order_index || topicIndex + 1,
              created_by: user.id
            }])
            .select()
            .single()

          if (topicError) throw topicError

          // Create slides for this topic
          const slidePromises = topic.slides
            .filter(slide => slide.title && slide.url)
            .map((slide, slideIndex) => 
              db.from("slides").insert([{
                title: slide.title,
                google_drive_url: slide.url,
                topic_id: topicData.id,
                order_index: slideIndex + 1,
                created_by: user.id
              }])
            )

          // Create videos for this topic
          const videoPromises = topic.videos
            .filter(video => video.title && video.url)
            .map((video, videoIndex) => 
              db.from("videos").insert([{
                title: video.title,
                youtube_url: video.url,
                topic_id: topicData.id,
                order_index: videoIndex + 1,
                created_by: user.id
              }])
            )

          // Execute all slide and video insertions in parallel
          await Promise.all([...slidePromises, ...videoPromises])

          createdTopics.push({
            ...topicData,
            slides_count: topic.slides.filter(s => s.title && s.url).length,
            videos_count: topic.videos.filter(v => v.title && v.url).length
          })
        }

        // Create study tools for this course
        const studyToolPromises = course.studyTools
          .filter(tool => tool.title && tool.type)
          .map(tool => 
            (async () => {
              // Try inserting with description first
              const toolData: any = {
                title: tool.title,
                type: tool.type,
                content_url: tool.content_url || null,
                course_id: courseData.id,
                exam_type: tool.exam_type || "both",
                created_by: user.id
              }

              // Only add description if it has a value
              if (tool.description) {
                toolData.description = tool.description
              }

              return db.from("study_tools").insert([toolData])
            })()
          )

        await Promise.all(studyToolPromises)

        createdCourses.push({
          ...courseData,
          topics: createdTopics,
          study_tools_count: course.studyTools.filter(t => t.title && t.type).length
        })

      } catch (courseError) {
        // If any course fails, we should ideally rollback, but Supabase doesn't support transactions
        // For now, we'll return an error with what was created
        return NextResponse.json(
          { 
            error: `Failed to create course "${course.title}": ${courseError.message}`,
            partial_success: {
              semester: semesterData,
              created_courses: createdCourses
            }
          },
          { status: 500 }
        )
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Successfully created semester with all courses and content",
      data: {
        semester: semesterData,
        courses: createdCourses,
        summary: {
          courses_created: createdCourses.length,
          topics_created: createdCourses.reduce((sum, course) => sum + course.topics.length, 0),
          slides_created: createdCourses.reduce((sum, course) => 
            sum + course.topics.reduce((topicSum, topic) => topicSum + topic.slides_count, 0), 0),
          videos_created: createdCourses.reduce((sum, course) => 
            sum + course.topics.reduce((topicSum, topic) => topicSum + topic.videos_count, 0), 0),
          study_tools_created: createdCourses.reduce((sum, course) => sum + course.study_tools_count, 0)
        }
      }
    })

  } catch (error) {
    console.error("Error in all-in-one creation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
