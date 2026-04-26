import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Try to get the first available slide or video as default content
    const { data: slides } = await supabase
      .from("slides")
      .select(`
        *,
        topics(id, title, courses(id, title))
      `)
      .limit(1)

    if (slides && slides.length > 0) {
      const slide = slides[0]
      return NextResponse.json({
        type: "slide",
        title: slide.title,
        url: slide.google_drive_url,
        id: slide.id,
        topicId: slide.topics?.id,
        courseId: slide.topics?.courses?.id,
        topicTitle: slide.topics?.title,
        courseTitle: slide.topics?.courses?.title,
      })
    }

    // If no slides, try videos
    const { data: videos } = await supabase
      .from("videos")
      .select(`
        *,
        topics(id, title, courses(id, title))
      `)
      .limit(1)

    if (videos && videos.length > 0) {
      const video = videos[0]
      return NextResponse.json({
        type: "video",
        title: video.title,
        url: video.youtube_url,
        id: video.id,
        topicId: video.topics?.id,
        courseId: video.topics?.courses?.id,
        topicTitle: video.topics?.title,
        courseTitle: video.topics?.courses?.title,
      })
    }

    return NextResponse.json(null)
  } catch (error) {
    console.error("Error fetching default content:", error)
    return NextResponse.json(null)
  }
}
