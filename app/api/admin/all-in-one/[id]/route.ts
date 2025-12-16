import { NextResponse, type NextRequest } from "next/server"
import { createDB } from "@/lib/supabase"

interface SemesterData {
  title: string
  description: string
  section: string
  has_midterm: boolean
  has_final: boolean
  start_date?: string
  end_date?: string
  default_credits?: number
  is_active?: boolean
}

interface CourseData {
  id?: string
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
  id?: string
  title: string
  description: string
  order_index?: number
  slides: { id?: string; title: string; url: string; description?: string }[]
  videos: { id?: string; title: string; url: string; description?: string }[]
}

interface StudyToolData {
  id?: string
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

/* --------------------------------  GET  ---------------------------------- */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createDB()

    // Fetch semester with all related data
    const { data: semester, error: semesterError } = await db
      .from("semesters")
      .select("*")
      .eq("id", id)
      .single()

    if (semesterError) {
      if (semesterError.code === "PGRST116") {
        return NextResponse.json({ error: "Semester not found" }, { status: 404 })
      }
      throw semesterError
    }

    // Fetch courses for this semester
    const { data: courses, error: coursesError } = await db
      .from("courses")
      .select("*")
      .eq("semester_id", id)
      .order("created_at", { ascending: true })

    if (coursesError) throw coursesError

    // For each course, fetch topics, slides, videos, and study tools
    const coursesWithContent = await Promise.all(
      (courses || []).map(async (course) => {
        // Fetch topics
        const { data: topics, error: topicsError } = await db
          .from("topics")
          .select("*")
          .eq("course_id", course.id)
          .order("order_index", { ascending: true })

        if (topicsError) throw topicsError

        // For each topic, fetch slides and videos
        const topicsWithContent = await Promise.all(
          (topics || []).map(async (topic) => {
            const [slidesResult, videosResult] = await Promise.all([
              db.from("slides")
                .select("*")
                .eq("topic_id", topic.id)
                .order("order_index", { ascending: true }),
              db.from("videos")
                .select("*")
                .eq("topic_id", topic.id)
                .order("order_index", { ascending: true })
            ])

            if (slidesResult.error) throw slidesResult.error
            if (videosResult.error) throw videosResult.error

            return {
              id: topic.id,
              title: topic.title || "",
              description: topic.description || "",
              order_index: topic.order_index || 0,
              slides: (slidesResult.data || []).map(slide => ({
                id: slide.id,
                title: slide.title || "",
                url: slide.google_drive_url || "",
                description: slide.description || ""
              })),
              videos: (videosResult.data || []).map(video => ({
                id: video.id,
                title: video.title || "",
                url: video.youtube_url || "",
                description: video.description || ""
              }))
            }
          })
        )

        // Fetch study tools for this course
        const { data: studyTools, error: studyToolsError } = await db
          .from("study_tools")
          .select("*")
          .eq("course_id", course.id)
          .order("created_at", { ascending: true })

        if (studyToolsError) throw studyToolsError

        return {
          id: course.id,
          title: course.title || "",
          course_code: course.course_code || "",
          teacher_name: course.teacher_name || "",
          teacher_email: course.teacher_email || "",
          credits: course.credits || 3,
          description: course.description || "",
          is_highlighted: course.is_highlighted || false,
          topics: topicsWithContent,
          studyTools: (studyTools || []).map(tool => ({
            id: tool.id,
            title: tool.title || "",
            type: tool.type || "previous_questions",
            content_url: tool.content_url || "",
            exam_type: tool.exam_type || "both",
            description: tool.description || ""
          }))
        }
      })
    )

    const result: AllInOneData = {
      semester: {
        title: semester.title || "",
        description: semester.description || "",
        section: semester.section || "",
        has_midterm: semester.has_midterm || false,
        has_final: semester.has_final || false,
        start_date: semester.start_date || "",
        end_date: semester.end_date || "",
        default_credits: semester.default_credits || 3,
        is_active: semester.is_active || false
      },
      courses: coursesWithContent
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("Error fetching semester details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to check if two objects have the same relevant fields
function hasChanges(existing: any, updated: any, fields: string[]): boolean {
  for (const field of fields) {
    const existingVal = existing[field] ?? null
    const updatedVal = updated[field] ?? null
    if (existingVal !== updatedVal) {
      return true
    }
  }
  return false
}

/* --------------------------------  PUT  ---------------------------------- */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data: AllInOneData = await request.json()
    const db = createDB()

    console.log("Updating semester with ID:", id)

    // Validate required fields
    if (!data.semester?.title || !data.semester?.section) {
      return NextResponse.json(
        { error: "Semester title and section are required" },
        { status: 400 }
      )
    }

    // Fetch existing semester with all related data for comparison
    const { data: existingSemester, error: checkError } = await db
      .from("semesters")
      .select("*")
      .eq("id", id)
      .single()

    if (checkError || !existingSemester) {
      return NextResponse.json(
        { error: "Semester not found" },
        { status: 404 }
      )
    }

    // Check if semester fields actually changed
    const semesterFields = ['title', 'description', 'section', 'has_midterm', 'has_final', 'start_date', 'end_date']
    const semesterNeedsUpdate = hasChanges(existingSemester, {
      title: data.semester.title,
      description: data.semester.description || null,
      section: data.semester.section,
      has_midterm: data.semester.has_midterm ?? true,
      has_final: data.semester.has_final ?? true,
      start_date: data.semester.start_date || null,
      end_date: data.semester.end_date || null
    }, semesterFields)

    if (semesterNeedsUpdate) {
      const semesterUpdate = {
        title: data.semester.title,
        description: data.semester.description || null,
        section: data.semester.section,
        has_midterm: data.semester.has_midterm ?? true,
        has_final: data.semester.has_final ?? true,
        start_date: data.semester.start_date || null,
        end_date: data.semester.end_date || null,
        updated_at: new Date().toISOString()
      }

      console.log("Updating semester with:", semesterUpdate)

      const { error: semesterError } = await db
        .from("semesters")
        .update(semesterUpdate)
        .eq("id", id)

      if (semesterError) {
        console.error("Semester update error:", semesterError)
        throw semesterError
      }
    } else {
      console.log("Semester unchanged, skipping update")
    }

    // Get existing courses to determine what to update/delete/create
    const { data: existingCourses, error: existingCoursesError } = await db
      .from("courses")
      .select("*")
      .eq("semester_id", id)

    if (existingCoursesError) {
      console.error("Error fetching existing courses:", existingCoursesError)
      throw existingCoursesError
    }

    const existingCourseMap = new Map((existingCourses || []).map(c => [c.id, c]))
    const existingCourseIds = new Set((existingCourses || []).map(c => c.id))
    const updatedCourseIds = new Set((data.courses || []).filter(c => c.id).map(c => c.id))

    // Delete courses that are no longer in the update
    const coursesToDelete = Array.from(existingCourseIds).filter(courseId => !updatedCourseIds.has(courseId))
    if (coursesToDelete.length > 0) {
      console.log("Deleting courses:", coursesToDelete)
      const { error: deleteError } = await db
        .from("courses")
        .delete()
        .in("id", coursesToDelete)

      if (deleteError) {
        console.error("Error deleting courses:", deleteError)
        throw deleteError
      }
    }

    // Process each course
    for (const course of data.courses || []) {
      if (!course.title || !course.course_code || !course.teacher_name) {
        console.warn("Skipping course with missing required fields:", course)
        continue
      }

      let courseId = course.id

      if (courseId && existingCourseMap.has(courseId)) {
        // Check if course actually changed
        const existingCourse = existingCourseMap.get(courseId)
        const courseFields = ['title', 'course_code', 'teacher_name', 'teacher_email', 'credits', 'description', 'is_highlighted']
        const courseNeedsUpdate = hasChanges(existingCourse, {
          title: course.title,
          course_code: course.course_code,
          teacher_name: course.teacher_name,
          teacher_email: course.teacher_email || null,
          credits: course.credits || 3,
          description: course.description || null,
          is_highlighted: course.is_highlighted || false
        }, courseFields)

        if (courseNeedsUpdate) {
          const courseUpdate = {
            title: course.title,
            course_code: course.course_code,
            teacher_name: course.teacher_name,
            teacher_email: course.teacher_email || null,
            credits: course.credits || 3,
            description: course.description || null,
            is_highlighted: course.is_highlighted || false,
            updated_at: new Date().toISOString()
          }

          console.log("Updating course:", courseId)

          const { error: courseError } = await db
            .from("courses")
            .update(courseUpdate)
            .eq("id", courseId)

          if (courseError) {
            console.error("Course update error:", courseError)
            throw courseError
          }
        } else {
          console.log("Course unchanged, skipping:", courseId)
        }
      } else {
        // Create new course
        const courseInsert = {
          title: course.title,
          course_code: course.course_code,
          teacher_name: course.teacher_name,
          teacher_email: course.teacher_email || null,
          credits: course.credits || 3,
          description: course.description || null,
          is_highlighted: course.is_highlighted || false,
          semester_id: id
        }

        console.log("Creating new course:", courseInsert)

        const { data: newCourse, error: courseError } = await db
          .from("courses")
          .insert([courseInsert])
          .select("id")
          .single()

        if (courseError) {
          console.error("Course creation error:", courseError)
          throw courseError
        }
        courseId = newCourse.id
      }

      // Handle topics with differential updates
      const { data: existingTopics, error: existingTopicsError } = await db
        .from("topics")
        .select("*")
        .eq("course_id", courseId)

      if (existingTopicsError) {
        console.error("Error fetching existing topics:", existingTopicsError)
        throw existingTopicsError
      }

      const existingTopicMap = new Map((existingTopics || []).map(t => [t.id, t]))
      const existingTopicIds = new Set((existingTopics || []).map(t => t.id))
      const updatedTopicIds = new Set((course.topics || []).filter(t => t.id).map(t => t.id))

      // Delete topics that are no longer in the update
      const topicsToDelete = Array.from(existingTopicIds).filter(topicId => !updatedTopicIds.has(topicId))
      if (topicsToDelete.length > 0) {
        console.log("Deleting topics:", topicsToDelete)
        const { error: deleteError } = await db
          .from("topics")
          .delete()
          .in("id", topicsToDelete)

        if (deleteError) {
          console.error("Error deleting topics:", deleteError)
          throw deleteError
        }
      }

      // Process topics with differential updates
      for (let topicIndex = 0; topicIndex < (course.topics || []).length; topicIndex++) {
        const topic = course.topics[topicIndex]

        if (!topic.title) {
          console.warn("Skipping topic with missing title:", topic)
          continue
        }

        let topicId = topic.id

        if (topicId && existingTopicMap.has(topicId)) {
          // Check if topic actually changed
          const existingTopic = existingTopicMap.get(topicId)
          const topicFields = ['title', 'description', 'order_index']
          const topicNeedsUpdate = hasChanges(existingTopic, {
            title: topic.title,
            description: topic.description || null,
            order_index: topicIndex
          }, topicFields)

          if (topicNeedsUpdate) {
            const topicUpdate = {
              title: topic.title,
              description: topic.description || null,
              order_index: topicIndex,
              updated_at: new Date().toISOString()
            }

            console.log("Updating topic:", topicId)

            const { error: topicError } = await db
              .from("topics")
              .update(topicUpdate)
              .eq("id", topicId)

            if (topicError) {
              console.error("Topic update error:", topicError)
              throw topicError
            }
          } else {
            console.log("Topic unchanged, skipping:", topicId)
          }
        } else {
          // Create new topic
          const topicInsert = {
            title: topic.title,
            description: topic.description || null,
            course_id: courseId,
            order_index: topicIndex
          }

          console.log("Creating new topic:", topicInsert)

          const { data: newTopic, error: topicError } = await db
            .from("topics")
            .insert([topicInsert])
            .select("id")
            .single()

          if (topicError) {
            console.error("Topic creation error:", topicError)
            throw topicError
          }
          topicId = newTopic.id
        }

        // Handle slides with differential updates - only update what changed
        const { data: existingSlides, error: existingSlidesError } = await db
          .from("slides")
          .select("*")
          .eq("topic_id", topicId)
          .order("order_index", { ascending: true })

        if (existingSlidesError) {
          console.error("Error fetching existing slides:", existingSlidesError)
          throw existingSlidesError
        }

        const existingSlideMap = new Map((existingSlides || []).map(s => [s.id, s]))
        const existingSlideIds = new Set((existingSlides || []).map(s => s.id))
        const updatedSlideIds = new Set((topic.slides || []).filter(s => s.id).map(s => s.id))

        // Delete slides that are no longer in the update
        const slidesToDelete = Array.from(existingSlideIds).filter(slideId => !updatedSlideIds.has(slideId))
        if (slidesToDelete.length > 0) {
          console.log("Deleting slides:", slidesToDelete)
          await db.from("slides").delete().in("id", slidesToDelete)
        }

        // Process slides - update existing or create new
        for (let slideIndex = 0; slideIndex < (topic.slides || []).length; slideIndex++) {
          const slide = topic.slides[slideIndex]
          if (!slide.title || !slide.url) continue

          if (slide.id && existingSlideMap.has(slide.id)) {
            // Check if slide actually changed
            const existingSlide = existingSlideMap.get(slide.id)
            const slideNeedsUpdate = hasChanges(existingSlide, {
              title: slide.title,
              google_drive_url: slide.url,
              description: slide.description || null,
              order_index: slideIndex
            }, ['title', 'google_drive_url', 'description', 'order_index'])

            if (slideNeedsUpdate) {
              console.log("Updating slide:", slide.id)
              await db.from("slides").update({
                title: slide.title,
                google_drive_url: slide.url,
                description: slide.description || null,
                order_index: slideIndex,
                updated_at: new Date().toISOString()
              }).eq("id", slide.id)
            }
          } else {
            // Create new slide
            console.log("Creating new slide:", slide.title)
            await db.from("slides").insert([{
              title: slide.title,
              google_drive_url: slide.url,
              description: slide.description || null,
              topic_id: topicId,
              order_index: slideIndex
            }])
          }
        }

        // Handle videos with differential updates
        const { data: existingVideos, error: existingVideosError } = await db
          .from("videos")
          .select("*")
          .eq("topic_id", topicId)
          .order("order_index", { ascending: true })

        if (existingVideosError) {
          console.error("Error fetching existing videos:", existingVideosError)
          throw existingVideosError
        }

        const existingVideoMap = new Map((existingVideos || []).map(v => [v.id, v]))
        const existingVideoIds = new Set((existingVideos || []).map(v => v.id))
        const updatedVideoIds = new Set((topic.videos || []).filter(v => v.id).map(v => v.id))

        // Delete videos that are no longer in the update
        const videosToDelete = Array.from(existingVideoIds).filter(videoId => !updatedVideoIds.has(videoId))
        if (videosToDelete.length > 0) {
          console.log("Deleting videos:", videosToDelete)
          await db.from("videos").delete().in("id", videosToDelete)
        }

        // Process videos - update existing or create new
        for (let videoIndex = 0; videoIndex < (topic.videos || []).length; videoIndex++) {
          const video = topic.videos[videoIndex]
          if (!video.title || !video.url) continue

          if (video.id && existingVideoMap.has(video.id)) {
            // Check if video actually changed
            const existingVideo = existingVideoMap.get(video.id)
            const videoNeedsUpdate = hasChanges(existingVideo, {
              title: video.title,
              youtube_url: video.url,
              description: video.description || null,
              order_index: videoIndex
            }, ['title', 'youtube_url', 'description', 'order_index'])

            if (videoNeedsUpdate) {
              console.log("Updating video:", video.id)
              await db.from("videos").update({
                title: video.title,
                youtube_url: video.url,
                description: video.description || null,
                order_index: videoIndex,
                updated_at: new Date().toISOString()
              }).eq("id", video.id)
            }
          } else {
            // Create new video
            console.log("Creating new video:", video.title)
            await db.from("videos").insert([{
              title: video.title,
              youtube_url: video.url,
              description: video.description || null,
              topic_id: topicId,
              order_index: videoIndex
            }])
          }
        }
      }

      // Handle study tools with differential updates
      const { data: existingStudyTools, error: existingStudyToolsError } = await db
        .from("study_tools")
        .select("*")
        .eq("course_id", courseId)

      if (existingStudyToolsError) {
        console.error("Error fetching existing study tools:", existingStudyToolsError)
        throw existingStudyToolsError
      }

      const existingToolMap = new Map((existingStudyTools || []).map(t => [t.id, t]))
      const existingToolIds = new Set((existingStudyTools || []).map(t => t.id))
      const updatedToolIds = new Set((course.studyTools || []).filter(t => t.id).map(t => t.id))

      // Delete study tools that are no longer in the update
      const toolsToDelete = Array.from(existingToolIds).filter(toolId => !updatedToolIds.has(toolId))
      if (toolsToDelete.length > 0) {
        console.log("Deleting study tools:", toolsToDelete)
        await db.from("study_tools").delete().in("id", toolsToDelete)
      }

      // Process study tools - update existing or create new
      for (const tool of (course.studyTools || [])) {
        if (!tool.title || !tool.type) continue

        if (tool.id && existingToolMap.has(tool.id)) {
          // Check if study tool actually changed
          const existingTool = existingToolMap.get(tool.id)
          const toolNeedsUpdate = hasChanges(existingTool, {
            title: tool.title,
            type: tool.type,
            content_url: tool.content_url || null,
            exam_type: tool.exam_type,
            description: tool.description || null
          }, ['title', 'type', 'content_url', 'exam_type', 'description'])

          if (toolNeedsUpdate) {
            console.log("Updating study tool:", tool.id)
            const toolData: any = {
              title: tool.title,
              type: tool.type,
              content_url: tool.content_url || null,
              exam_type: tool.exam_type,
              updated_at: new Date().toISOString()
            }
            if (tool.description) {
              toolData.description = tool.description
            }
            await db.from("study_tools").update(toolData).eq("id", tool.id)
          }
        } else {
          // Create new study tool
          console.log("Creating new study tool:", tool.title)
          const toolData: any = {
            title: tool.title,
            type: tool.type,
            content_url: tool.content_url || null,
            course_id: courseId,
            exam_type: tool.exam_type
          }
          if (tool.description) {
            toolData.description = tool.description
          }
          await db.from("study_tools").insert([toolData])
        }
      }
    }

    console.log("Successfully updated semester (optimized - only changed items)")

    return NextResponse.json({
      success: true,
      message: "Successfully updated semester and all content",
      semesterId: id
    })

  } catch (error) {
    console.error("Error updating semester:", error)

    // Provide more detailed error information
    let errorMessage = "Internal server error"
    let errorDetails = null

    if (error && typeof error === 'object') {
      if ('message' in error) {
        errorMessage = error.message
      }
      if ('code' in error) {
        errorDetails = {
          code: error.code,
          details: error.details || null,
          hint: error.hint || null
        }
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        success: false
      },
      { status: 500 }
    )
  }
}

/* --------------------------------  DELETE  -------------------------------- */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createDB()

    // Delete semester (cascade will handle related records)
    const { error } = await db
      .from("semesters")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Successfully deleted semester and all related content"
    })

  } catch (error) {
    console.error("Error deleting semester:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
