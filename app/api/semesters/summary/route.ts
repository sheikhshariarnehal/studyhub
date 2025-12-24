import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser, isContributor, isAdmin, getContentFilterForUser, canManageContent } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    
    // Get viewing context from query params
    const viewDepartmentId = searchParams.get('department_id') || undefined
    const viewBatchId = searchParams.get('batch_id') || undefined

    // Build query for semesters with department/batch info
    let query = supabase
      .from("semesters")
      .select(`
        *,
        departments:department_id (id, name, short_name),
        batches:batch_id (id, batch_name, batch_number)
      `)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false })

    // Apply department/batch filtering for contributors
    if (user && isContributor(user)) {
      const contentFilter = getContentFilterForUser(user, viewDepartmentId, viewBatchId)
      
      // Filter by department if specified
      if (contentFilter.department_id) {
        query = query.eq('department_id', contentFilter.department_id)
      }
      
      // Filter by batch if specified
      if (contentFilter.batch_id) {
        query = query.eq('batch_id', contentFilter.batch_id)
      }
      
      // Exclude content without department/batch for contributors
      if (contentFilter.excludeNullDeptBatch) {
        query = query.not('department_id', 'is', null).not('batch_id', 'is', null)
      }
    } else {
      // For admins, allow optional filtering but don't require it
      if (viewDepartmentId) {
        query = query.eq('department_id', viewDepartmentId)
      }
      if (viewBatchId) {
        query = query.eq('batch_id', viewBatchId)
      }
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

        // Add canEdit permission flag
        const canEdit = user ? (isAdmin(user) || canManageContent(user, semester.department_id, semester.batch_id)) : false

        return {
          ...semester,
          courses_count: coursesCount || 0,
          topics_count: topicsCount,
          materials_count: slidesCount + videosCount,
          study_tools_count: studyToolsCount,
          canEdit,
        }
      })
    )

    return NextResponse.json({
      semesters: semestersWithCounts,
      total: semestersWithCounts.length,
      active: semestersWithCounts.filter(s => s.is_active).length,
      inactive: semestersWithCounts.filter(s => !s.is_active).length,
      // Include user context for UI
      userContext: user ? {
        role: user.role,
        department_id: user.department_id,
        batch_id: user.batch_id,
        department: user.department,
        batch: user.batch,
      } : null,
    })
  } catch (error) {
    console.error("Error in /api/semesters/summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
