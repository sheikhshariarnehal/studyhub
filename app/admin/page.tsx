"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentActivity } from "@/components/admin/recent-activity"
import { ContentChart } from "@/components/admin/content-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AlertCircle, 
  Plus, 
  Layers, 
  BookOpen, 
  FileText, 
  Calendar,
  ArrowRight,
  TrendingUp,
  Zap
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const quickActions = [
  {
    title: "Bulk Creator",
    description: "Create multiple items at once",
    href: "/admin/bulk-creator",
    icon: Layers,
    color: "from-violet-500 to-purple-600",
    badge: "Pro"
  },
  {
    title: "Add Course",
    description: "Create a new course",
    href: "/admin/courses",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-600",
  },
  {
    title: "Add Topic",
    description: "Create a new topic",
    href: "/admin/topics",
    icon: FileText,
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Manage Semesters",
    description: "View all semesters",
    href: "/admin/semesters",
    icon: Calendar,
    color: "from-orange-500 to-amber-600",
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <Suspense fallback={<DashboardLoading />}>
        <DashboardStats />
      </Suspense>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-muted-foreground/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Content Overview</CardTitle>
                <CardDescription>Distribution of content across courses</CardDescription>
              </div>
              <Link href="/admin/content">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px]" />}>
              <ContentChart />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-muted-foreground/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest updates and changes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px]" />}>
              <RecentActivity />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full border-muted-foreground/20 hover:border-primary/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    {action.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                  <div className="mt-3 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="font-medium">Get started</span>
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Help Card */}
      <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-muted-foreground/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="p-3 rounded-xl bg-primary/10 w-fit">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Check out the documentation for detailed guides on managing content, users, and platform settings.
              </p>
            </div>
            <Link href="/admin/diagnostics">
              <Button variant="outline" className="shrink-0">
                View Diagnostics
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




