import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

/**
 * GET /api/content/lookup
 * Look up content by short ID (first 8 characters of UUID)
 * Query params:
 *   - type: 'video' | 'slide' | 'study-tool'
 *   - shortId: first 8 characters of UUID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const shortId = searchParams.get('shortId')

    if (!type || !shortId) {
      return NextResponse.json(
        { error: "Missing required parameters: type and shortId" },
        { status: 400 }
      )
    }

    if (!['video', 'slide', 'study-tool'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid content type. Must be 'video', 'slide', or 'study-tool'" },
        { status: 400 }
      )
    }

    // Validate short ID format (8 hex characters)
    if (!/^[a-f0-9]{8}$/i.test(shortId)) {
      return NextResponse.json(
        { error: "Invalid shortId format. Must be 8 hexadecimal characters" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Determine table based on type
    let tableName: string
    let selectQuery: string

    switch (type) {
      case 'video':
        tableName = 'videos'
        selectQuery = `
          id,
          title,
          youtube_url,
          description,
          duration,
          view_count,
          topic:topics!videos_topic_id_fkey(
            id,
            title,
            course:courses!topics_course_id_fkey(
              id,
              title,
              course_code,
              teacher_name,
              semester:semesters!courses_semester_id_fkey(
                id,
                title,
                section,
                is_active
              )
            )
          )
        `
        break
      case 'slide':
        tableName = 'slides'
        selectQuery = `
          id,
          title,
          google_drive_url,
          description,
          file_size_mb,
          slide_count,
          is_downloadable,
          topic:topics!slides_topic_id_fkey(
            id,
            title,
            course:courses!topics_course_id_fkey(
              id,
              title,
              course_code,
              teacher_name,
              semester:semesters!courses_semester_id_fkey(
                id,
                title,
                section,
                is_active
              )
            )
          )
        `
        break
      case 'study-tool':
        tableName = 'study_tools'
        selectQuery = `
          id,
          title,
          google_drive_url,
          description,
          type,
          download_count,
          course:courses!study_tools_course_id_fkey(
            id,
            title,
            course_code,
            teacher_name,
            semester:semesters!courses_semester_id_fkey(
              id,
              title,
              section,
              is_active
            )
          )
        `
        break
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    // Search for content where ID starts with the short ID
    const { data, error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .ilike('id', `${shortId}%`)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Content not found" },
          { status: 404 }
        )
      }
      console.error(`[content/lookup] Error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      )
    }

    // Cast data to any to access nested properties
    const content = data as any

    // Format response based on type
    let response: Record<string, any>

    if (type === 'video') {
      response = {
        id: content.id,
        title: content.title,
        url: content.youtube_url,
        description: content.description,
        duration: content.duration,
        view_count: content.view_count,
        type: 'video',
        topic: content.topic ? {
          id: content.topic.id,
          title: content.topic.title,
        } : undefined,
        course: content.topic?.course ? {
          id: content.topic.course.id,
          title: content.topic.course.title,
          course_code: content.topic.course.course_code,
          teacher_name: content.topic.course.teacher_name,
        } : undefined,
        semesterInfo: content.topic?.course?.semester ? {
          id: content.topic.course.semester.id,
          title: content.topic.course.semester.title,
          section: content.topic.course.semester.section,
          is_active: content.topic.course.semester.is_active,
        } : undefined,
      }
    } else if (type === 'slide') {
      response = {
        id: content.id,
        title: content.title,
        url: content.google_drive_url,
        description: content.description,
        file_size_mb: content.file_size_mb,
        slide_count: content.slide_count,
        is_downloadable: content.is_downloadable,
        type: 'slide',
        topic: content.topic ? {
          id: content.topic.id,
          title: content.topic.title,
        } : undefined,
        course: content.topic?.course ? {
          id: content.topic.course.id,
          title: content.topic.course.title,
          course_code: content.topic.course.course_code,
          teacher_name: content.topic.course.teacher_name,
        } : undefined,
        semesterInfo: content.topic?.course?.semester ? {
          id: content.topic.course.semester.id,
          title: content.topic.course.semester.title,
          section: content.topic.course.semester.section,
          is_active: content.topic.course.semester.is_active,
        } : undefined,
      }
    } else {
      response = {
        id: content.id,
        title: content.title,
        url: content.google_drive_url,
        description: content.description,
        studyToolType: content.type,
        download_count: content.download_count,
        type: content.type === 'syllabus' ? 'syllabus' : 'study-tool',
        course: content.course ? {
          id: content.course.id,
          title: content.course.title,
          course_code: content.course.course_code,
          teacher_name: content.course.teacher_name,
        } : undefined,
        semesterInfo: content.course?.semester ? {
          id: content.course.semester.id,
          title: content.course.semester.title,
          section: content.course.semester.section,
          is_active: content.course.semester.is_active,
        } : undefined,
      }
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error("[content/lookup] Error:", err)
    return NextResponse.json(
      { error: "Failed to lookup content" },
      { status: 500 }
    )
  }
}
