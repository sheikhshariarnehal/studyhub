"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Home,
  Menu,
  Play,
  Settings,
  Users,
  X,
  Shield,
  GitCompare,
  TestTube,
  Layers,
  FolderOpen,
  FileQuestion,
  BookMarked,
  ClipboardList,
  FlaskConical,
  Library,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

import { type AdminUser } from "@/contexts/auth-context"

interface AdminSidebarProps {
  user: AdminUser
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
  children?: NavItem[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Bulk Creator", href: "/admin/bulk-creator", icon: Layers, badge: "Pro" },
  { name: "Create Semester", href: "/admin/semester-management", icon: GraduationCap },
  { name: "Semesters", href: "/admin/semesters", icon: Calendar },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Topics", href: "/admin/topics", icon: FileText },
  { name: "Content", href: "/admin/content", icon: FileText },
  { 
    name: "Resources", 
    href: "/admin/resources", 
    icon: FolderOpen,
    children: [
      { name: "All Resources", href: "/admin/resources", icon: FolderOpen },
      { name: "Previous Questions", href: "/admin/resources/previous-questions", icon: FileQuestion },
      { name: "Exam Notes", href: "/admin/resources/exam-notes", icon: BookMarked },
      { name: "Syllabus", href: "/admin/resources/syllabus", icon: ClipboardList },
      { name: "Lab Manuals", href: "/admin/resources/lab-manuals", icon: FlaskConical },
      { name: "Reference Books", href: "/admin/resources/reference-books", icon: Library },
    ]
  },
  { name: "Study Tools", href: "/admin/study-tools", icon: Play },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Resources"])
  const pathname = usePathname()

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800"
      case "admin":
        return "bg-blue-100 text-blue-800"
      case "moderator":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Dashboard</h2>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href))
              const isExpanded = expandedItems.includes(item.name)
              const hasChildren = item.children && item.children.length > 0

              if (hasChildren) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                isChildActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                              )}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <child.icon className="h-4 w-4" />
                              <span className="flex-1">{child.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-border mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge className={cn("text-xs", getRoleBadgeColor(user.role))}>
                {user.role.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
