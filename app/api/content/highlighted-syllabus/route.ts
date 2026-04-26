import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get the first highlighted course from an active semester
    const { data: highlightedCourses, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        course_code,
        teacher_name,
        semester:semesters (
          id,
          title,
          section,
          is_active
        )
      `)
      .eq("is_highlighted", true)
      .eq("semesters.is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)

    if (coursesError) {
      console.error("Error fetching highlighted courses:", coursesError)
      return NextResponse.json({ error: coursesError.message }, { status: 500 })
    }

    if (!highlightedCourses || highlightedCourses.length === 0) {
      return NextResponse.json({ message: "No highlighted courses found" }, { status: 404 })
    }

    const course = highlightedCourses[0]

    // Get the syllabus for this course
    const { data: syllabus, error: syllabusError } = await supabase
      .from("study_tools")
      .select("*")
      .eq("course_id", course.id)
      .eq("type", "syllabus")
      .limit(1)

    if (syllabusError) {
      console.error("Error fetching syllabus:", syllabusError)
      return NextResponse.json({ error: syllabusError.message }, { status: 500 })
    }

    // If syllabus exists, return it
    if (syllabus && syllabus.length > 0) {
      const syllabusData = syllabus[0]
      const contentItem = {
        type: "syllabus" as const,
        title: syllabusData.title,
        url: `#syllabus-${syllabusData.id}`,
        id: syllabusData.id,
        courseId: course.id,
        courseTitle: course.title,
        description: syllabusData.description,
        courseCode: course.course_code,
        teacherName: course.teacher_name,
        semesterInfo: course.semester
      }
      return NextResponse.json(contentItem)
    }

    // If no syllabus, try to get any other study tool from this course
    const { data: otherStudyTools, error: otherToolsError } = await supabase
      .from("study_tools")
      .select("*")
      .eq("course_id", course.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (!otherToolsError && otherStudyTools && otherStudyTools.length > 0) {
      const studyTool = otherStudyTools[0]
      const contentItem = {
        type: studyTool.type === "syllabus" ? "syllabus" : "study-tool" as const,
        title: studyTool.title,
        url: studyTool.type === "syllabus" ? `#syllabus-${studyTool.id}` : studyTool.content_url || `#study-tool-${studyTool.id}`,
        id: studyTool.id,
        courseId: course.id,
        courseTitle: course.title,
        description: studyTool.description,
        courseCode: course.course_code,
        teacherName: course.teacher_name,
        semesterInfo: course.semester
      }
      return NextResponse.json(contentItem)
    }

    // If no study tools, try to get first slide from any topic in this course
    const { data: slides, error: slidesError } = await supabase
      .from("slides")
      .select(`
        *,
        topics!inner (
          id,
          title,
          course_id
        )
      `)
      .eq("topics.course_id", course.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (!slidesError && slides && slides.length > 0) {
      const slide = slides[0]
      const contentItem = {
        type: "slide" as const,
        title: slide.title,
        url: slide.google_drive_url,
        id: slide.id,
        courseId: course.id,
        topicId: slide.topics?.id,
        topicTitle: slide.topics?.title,
        courseTitle: course.title,
        courseCode: course.course_code,
        teacherName: course.teacher_name,
        semesterInfo: course.semester
      }
      return NextResponse.json(contentItem)
    }

    // If no slides, try to get first video from any topic in this course
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select(`
        *,
        topics!inner (
          id,
          title,
          course_id
        )
      `)
      .eq("topics.course_id", course.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (!videosError && videos && videos.length > 0) {
      const video = videos[0]
      const contentItem = {
        type: "video" as const,
        title: video.title,
        url: video.youtube_url,
        id: video.id,
        courseId: course.id,
        topicId: video.topics?.id,
        topicTitle: video.topics?.title,
        courseTitle: course.title,
        courseCode: course.course_code,
        teacherName: course.teacher_name,
        semesterInfo: course.semester
      }
      return NextResponse.json(contentItem)
    }

    // If no content found at all for the featured course
    return NextResponse.json({ message: "No content found for highlighted course" }, { status: 404 })
  } catch (error) {
    console.error("Error in highlighted-syllabus API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
