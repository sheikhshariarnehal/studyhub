import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser, isContributor, isAdmin, getContentFilterForUser, canManageContent } from "@/lib/auth-utils"

interface SemesterCounts {
  courses_count: number
  topics_count: number
  materials_count: number
  study_tools_count: number
}

// Optimized query to get all counts in a single batch
async function getAggregatedCounts(semesterIds: string[]): Promise<Record<string, SemesterCounts>> {
  if (semesterIds.length === 0) return {}

  // Single query to get all courses with their semester_id
  const { data: allCourses } = await supabase
    .from("courses")
    .select("id, semester_id")
    .in("semester_id", semesterIds)

  if (!allCourses || allCourses.length === 0) {
    return semesterIds.reduce((acc, id) => ({
      ...acc,
      [id]: { courses_count: 0, topics_count: 0, materials_count: 0, study_tools_count: 0 }
    }), {} as Record<string, SemesterCounts>)
  }

  // Group courses by semester
  const coursesBySemester = allCourses.reduce((acc, course) => {
    if (!acc[course.semester_id]) acc[course.semester_id] = []
    acc[course.semester_id].push(course.id)
    return acc
  }, {} as Record<string, string[]>)

  const allCourseIds = allCourses.map(c => c.id)

  // Batch fetch all topics for all courses at once
  const { data: allTopics } = await supabase
    .from("topics")
    .select("id, course_id")
    .in("course_id", allCourseIds)

  // Group topics by course
  const topicsByCourse = (allTopics || []).reduce((acc, topic) => {
    if (!acc[topic.course_id]) acc[topic.course_id] = []
    acc[topic.course_id].push(topic.id)
    return acc
  }, {} as Record<string, string[]>)

  const allTopicIds = (allTopics || []).map(t => t.id)

  // Batch fetch all slides and videos counts using aggregation
  const [slidesResult, videosResult, studyToolsResult] = await Promise.all([
    allTopicIds.length > 0 
      ? supabase.from("slides").select("topic_id").in("topic_id", allTopicIds)
      : Promise.resolve({ data: [] as { topic_id: string }[] }),
    allTopicIds.length > 0 
      ? supabase.from("videos").select("topic_id").in("topic_id", allTopicIds)
      : Promise.resolve({ data: [] as { topic_id: string }[] }),
    allCourseIds.length > 0 
      ? supabase.from("study_tools").select("course_id").in("course_id", allCourseIds)
      : Promise.resolve({ data: [] as { course_id: string }[] })
  ])

  // Count slides by topic
  const slidesByTopic = (slidesResult.data || []).reduce((acc, slide) => {
    acc[slide.topic_id] = (acc[slide.topic_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Count videos by topic
  const videosByTopic = (videosResult.data || []).reduce((acc, video) => {
    acc[video.topic_id] = (acc[video.topic_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Count study tools by course
  const studyToolsByCourse = (studyToolsResult.data || []).reduce((acc, tool) => {
    acc[tool.course_id] = (acc[tool.course_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate aggregated counts for each semester
  const result: Record<string, SemesterCounts> = {}

  for (const semesterId of semesterIds) {
    const semesterCourseIds = coursesBySemester[semesterId] || []
    const coursesCount = semesterCourseIds.length

    let topicsCount = 0
    let materialsCount = 0
    let studyToolsCount = 0

    for (const courseId of semesterCourseIds) {
      const courseTopicIds = topicsByCourse[courseId] || []
      topicsCount += courseTopicIds.length
      studyToolsCount += studyToolsByCourse[courseId] || 0

      for (const topicId of courseTopicIds) {
        materialsCount += (slidesByTopic[topicId] || 0) + (videosByTopic[topicId] || 0)
      }
    }

    result[semesterId] = {
      courses_count: coursesCount,
      topics_count: topicsCount,
      materials_count: materialsCount,
      study_tools_count: studyToolsCount
    }
  }

  return result
}

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

    // Get all counts in a single optimized batch query
    const semesterIds = (semesters || []).map(s => s.id)
    const aggregatedCounts = await getAggregatedCounts(semesterIds)

    // Combine semesters with counts and permissions
    const semestersWithCounts = (semesters || []).map((semester) => {
      const counts = aggregatedCounts[semester.id] || {
        courses_count: 0,
        topics_count: 0,
        materials_count: 0,
        study_tools_count: 0
      }

      // Add canEdit permission flag
      const canEdit = user ? (isAdmin(user) || canManageContent(user, semester.department_id, semester.batch_id)) : false

      return {
        ...semester,
        ...counts,
        canEdit,
      }
    })

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
