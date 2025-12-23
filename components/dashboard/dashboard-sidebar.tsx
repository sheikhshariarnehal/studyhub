"use client"

import { useState, useCallback, memo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  BookMarked,
  FileQuestion,
  ClipboardList,
  FlaskConical,
  Library,
} from "lucide-react"

// Types
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

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
  requiresApproval?: boolean
  children?: NavItem[]
}

// Navigation config - clean and organized
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

// User Avatar Component
const UserAvatar = memo(({ user, size = "md" }: { user: DashboardUser; size?: "sm" | "md" }) => {
  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
  
  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        className={cn(sizeClasses, "rounded-full object-cover ring-2 ring-background")}
      />
    )
  }

  return (
    <div className={cn(sizeClasses, "rounded-full bg-primary flex items-center justify-center font-semibold text-primary-foreground")}>
      {getInitials(user.full_name)}
    </div>
  )
})
UserAvatar.displayName = "UserAvatar"

// Nav Item Component
const NavItemComponent = memo(({ 
  item, 
  isActive, 
  isExpanded, 
  isDisabled,
  onToggle,
  onMobileClose,
  pathname
}: { 
  item: NavItem
  isActive: boolean
  isExpanded: boolean
  isDisabled: boolean
  onToggle: (name: string) => void
  onMobileClose: () => void
  pathname: string
}) => {
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div className="space-y-0.5">
        <button
          onClick={() => !isDisabled && onToggle(item.name)}
          disabled={isDisabled}
          className={cn(
            "flex items-center w-full gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            isDisabled && "opacity-50 cursor-not-allowed",
            !isDisabled && isActive && "bg-primary/10 text-primary",
            !isDisabled && !isActive && "text-foreground/80 hover:bg-accent hover:text-foreground"
          )}
        >
          <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="flex-1 text-left truncate">{item.name}</span>
          {item.badge && (
            <Badge className="text-[10px] h-5 px-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 font-medium">
              {item.badge}
            </Badge>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )} />
        </button>
        
        <div className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          {!isDisabled && item.children && (
            <div className="ml-6 pl-3 border-l border-border/50 space-y-0.5 py-1">
              {item.children.map((child) => {
                const isChildActive = pathname === child.href
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-150",
                      isChildActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={onMobileClose}
                  >
                    <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{child.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground/80 hover:bg-accent hover:text-foreground"
      )}
      onClick={onMobileClose}
    >
      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge && (
        <Badge className="text-[10px] h-5 px-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
          {item.badge}
        </Badge>
      )}
    </Link>
  )
})
NavItemComponent.displayName = "NavItemComponent"

// Main Sidebar Component
export function DashboardSidebar({ user }: { user: DashboardUser }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = useCallback((name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    )
  }, [])

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [])

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 h-9 w-9 bg-background/95 backdrop-blur"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col",
          "transform transition-transform duration-300 ease-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header - matches dashboard header height */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <h2 className="font-semibold text-sm text-foreground">DIU Learning</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Contributor Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={closeMobileMenu}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.children?.some((child) => pathname === child.href))
              const isExpanded = expandedItems.includes(item.name)
              const isDisabled = item.requiresApproval && !user.is_approved

              return (
                <NavItemComponent
                  key={item.name}
                  item={item}
                  isActive={!!isActive}
                  isExpanded={isExpanded}
                  isDisabled={!!isDisabled}
                  onToggle={toggleExpanded}
                  onMobileClose={closeMobileMenu}
                  pathname={pathname}
                />
              )
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border/50 space-y-2">
          {!user.is_approved && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                ⏳ Your account is pending approval. Some features are limited.
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  )
}
