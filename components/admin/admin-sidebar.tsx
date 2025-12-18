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
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header - aligned with main header height */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base leading-tight">DIU Admin</h2>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Dashboard</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 space-y-1 overflow-y-auto flex-1 scrollbar-thin">
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
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full group",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isActive ? "bg-primary/20" : "bg-muted group-hover:bg-accent"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-left">{item.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-3">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                isChildActive
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                              )}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <child.icon className="h-3.5 w-3.5" />
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
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isActive ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-accent"
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
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
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary-foreground">
                  {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                    {user.role.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
