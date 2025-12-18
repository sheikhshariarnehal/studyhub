"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Menu,
  X,
  User,
  BookOpen,
  FolderOpen,
  Layers,
  GraduationCap,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  BookMarked,
  FileQuestion,
  ClipboardList,
  FlaskConical,
  Library,
} from "lucide-react"

interface DashboardUser {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url?: string
  is_approved: boolean
  batches?: {
    batch_name: string
    batch_number: number
  }
}

interface DashboardSidebarProps {
  user: DashboardUser
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
  requiresApproval?: boolean
  children?: NavItem[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Profile", href: "/dashboard/profile", icon: User },
  { 
    name: "Bulk Creator", 
    href: "/dashboard/create", 
    icon: Layers,
    badge: "New",
    requiresApproval: true,
    children: [
      { name: "Bulk Creator", href: "/dashboard/create/bulk", icon: Layers },
      { name: "Add Semester", href: "/dashboard/create/semester", icon: GraduationCap },
      { name: "Add Course", href: "/dashboard/create/course", icon: BookOpen },
      { name: "Add Resources", href: "/dashboard/create/resources", icon: FolderOpen },
    ]
  },
  { 
    name: "Resources", 
    href: "/dashboard/create/resources", 
    icon: FolderOpen,
    requiresApproval: true,
    children: [
      { name: "All Resources", href: "/dashboard/create/resources", icon: FolderOpen },
      { name: "Previous Questions", href: "/dashboard/create/resources/previous-questions", icon: FileQuestion },
      { name: "Exam Notes", href: "/dashboard/create/resources/exam-notes", icon: BookMarked },
      { name: "Syllabus", href: "/dashboard/create/resources/syllabus", icon: ClipboardList },
      { name: "Lab Manuals", href: "/dashboard/create/resources/lab-manuals", icon: FlaskConical },
      { name: "Reference Books", href: "/dashboard/create/resources/reference-books", icon: Library },
    ]
  },
  { name: "Browse Content", href: "/dashboard/browse", icon: BookOpen },
  { name: "My Contributions", href: "/dashboard/contributions", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Bulk Creator"])
  const pathname = usePathname()

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    )
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base leading-tight">
                  DIU Learning
                </h2>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Contributor Portal
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Quick Info */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-background"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {getInitials(user.full_name)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.full_name}
                </p>
                <div className="flex items-center gap-2">
                  {user.batches && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {user.batches.batch_name}
                    </Badge>
                  )}
                  {!user.is_approved && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 border-yellow-300">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 space-y-1 overflow-y-auto flex-1 scrollbar-thin">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.children &&
                  item.children.some((child) => pathname === child.href))
              const isExpanded = expandedItems.includes(item.name)
              const hasChildren = item.children && item.children.length > 0
              const isDisabled = item.requiresApproval && !user.is_approved

              if (hasChildren) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => !isDisabled && toggleExpanded(item.name)}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full group",
                        isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          isActive
                            ? "bg-primary/20"
                            : "bg-muted group-hover:bg-accent"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border-green-500/30"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform" />
                      )}
                    </button>
                    {isExpanded && !isDisabled && item.children && (
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
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      isActive
                        ? "bg-primary-foreground/20"
                        : "bg-muted group-hover:bg-accent"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            {!user.is_approved && (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-2">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  ⏳ Your account is pending approval. Some features are limited.
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
