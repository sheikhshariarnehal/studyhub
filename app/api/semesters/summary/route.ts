import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser, isContributor } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthUser(request)

    // Build query for semesters
    let query = supabase
      .from("semesters")
      .select("*")
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false })

    // Contributors can only see their own semesters
    if (user && isContributor(user)) {
      query = query.eq("created_by", user.id)
    }

    const { data: semesters, error: semestersError } = await query

    if (semestersError) {
      console.error("Error fetching semesters:", semestersError)
      return NextResponse.json({ error: semestersError.message }, { status: 500 })
    }

    // Get counts for each semester
    const semestersWithCounts = await Promise.all(
      (semesters || []).map(async (semester) => {
        // Get courses count
        const { count: coursesCount } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("semester_id", semester.id)

        // Get topics count (topics are linked to courses, not directly to semesters)
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id")
          .eq("semester_id", semester.id)
        
        const courseIds = coursesData?.map(c => c.id) || []
        
        let topicsCount = 0
        let slidesCount = 0
        let videosCount = 0
        let studyToolsCount = 0
        
        if (courseIds.length > 0) {
          // Get topics count for all courses in this semester
          const { count: tCount } = await supabase
            .from("topics")
            .select("*", { count: "exact", head: true })
            .in("course_id", courseIds)
          topicsCount = tCount || 0

          // Get materials count (slides + videos) for topics in these courses
          const { data: topicsData } = await supabase
            .from("topics")
            .select("id")
            .in("course_id", courseIds)
          
          const topicIds = topicsData?.map(t => t.id) || []
          
          if (topicIds.length > 0) {
            const { count: sCount } = await supabase
              .from("slides")
              .select("*", { count: "exact", head: true })
              .in("topic_id", topicIds)
            slidesCount = sCount || 0

            const { count: vCount } = await supabase
              .from("videos")
              .select("*", { count: "exact", head: true })
              .in("topic_id", topicIds)
            videosCount = vCount || 0
          }

          // Get study tools count for courses in this semester
          const { count: stCount } = await supabase
            .from("study_tools")
            .select("*", { count: "exact", head: true })
            .in("course_id", courseIds)
          studyToolsCount = stCount || 0
        }

        return {
          ...semester,
          courses_count: coursesCount || 0,
          topics_count: topicsCount,
          materials_count: slidesCount + videosCount,
          study_tools_count: studyToolsCount
        }
      })
    )

    return NextResponse.json({
      semesters: semestersWithCounts,
      total: semestersWithCounts.length,
      active: semestersWithCounts.filter(s => s.is_active).length,
      inactive: semestersWithCounts.filter(s => !s.is_active).length
    })
  } catch (error) {
    console.error("Error in /api/semesters/summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
