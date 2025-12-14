import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Optimized content endpoint with minimal data transfer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params
    
    // Add cache headers for better performance
    const headers = {
      'Cache-Control': 'public, max-age=300, s-maxage=600', // 5min browser, 10min CDN
      'Content-Type': 'application/json',
    }

    let data
    let error

    switch (type) {
      case 'slide':
        ({ data, error } = await supabase
          .from("slides")
          .select(`
            id,
            title,
            google_drive_url,
            description,
            topic:topics!inner(
              id,
              title,
              course:courses!inner(
                id,
                title,
                course_code,
                teacher_name
              )
            )
          `)
          .eq("id", id)
          .single())
        break

      case 'video':
        ({ data, error } = await supabase
          .from("videos")
          .select(`
            id,
            title,
            youtube_url,
            description,
            topic:topics!inner(
              id,
              title,
              course:courses!inner(
                id,
                title,
                course_code,
                teacher_name
              )
            )
          `)
          .eq("id", id)
          .single())
        break

      case 'study-tool':
        ({ data, error } = await supabase
          .from("study_tools")
          .select(`
            id,
            title,
            content_url,
            type,
            exam_type,
            course:courses!inner(
              id,
              title,
              course_code,
              teacher_name
            )
          `)
          .eq("id", id)
          .single())
        break

      default:
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 400, headers }
        )
    }

    if (error) {
      console.error(`Error fetching ${type}:`, error)
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: `${type} not found` },
        { status: 404, headers }
      )
    }

    // Transform data to optimized format
    const optimizedData = {
      id: data.id,
      title: data.title,
      type,
      url: type === 'slide' ? data.google_drive_url : 
           type === 'video' ? data.youtube_url : 
           data.content_url,
      description: data.description,
      topicTitle: data.topic?.title,
      courseTitle: data.topic?.course?.title || data.course?.title,
      courseCode: data.topic?.course?.course_code || data.course?.course_code,
      teacherName: data.topic?.course?.teacher_name || data.course?.teacher_name,
      // Add minimal metadata for SEO
      metadata: {
        title: `${data.title} - ${data.topic?.course?.title || data.course?.title || 'DIU Learning'}`,
        description: data.description || `${type} content from DIU Learning Platform`,
        type: type,
        courseCode: data.topic?.course?.course_code || data.course?.course_code
      }
    }

    return NextResponse.json(optimizedData, { headers })

  } catch (error) {
    console.error("Optimized content API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
