"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Sun, User, Moon, Menu, X, LogOut, Settings, ChevronDown, BookOpen, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navigationItems = [
    { name: "Home", href: "/", icon: BookOpen, primary: false },
    { name: "Notes", href: "/notes", icon: GraduationCap, primary: false },
    { name: "Contributor", href: "/contributor", primary: false },
    { name: "Result", href: "/result", primary: false },
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  // Mock notifications - replace with real data
  const notifications = [
    { id: 1, title: "New course available", message: "Data Structures course is now live", time: "2 hours ago", unread: true },
    { id: 2, title: "Assignment reminder", message: "Due date approaching for AI project", time: "5 hours ago", unread: true },
    { id: 3, title: "Grade posted", message: "Your exam grade has been posted", time: "1 day ago", unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  if (!mounted) {
    return null
  }

  return (
    <header className={cn(
      "border-b border-border/30 sticky top-0 z-50 backdrop-blur-xl bg-background/95 shadow-sm",
      className
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group"
            >
              {/* Logo Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-border/30 shadow-sm">
                <img
                  src="/images/studyhub_diu_Favicon .png"
                  alt="StudyHub DIU"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.fallback-text')) {
                      const fallback = document.createElement('span')
                      fallback.className = 'fallback-text text-primary font-semibold text-sm'
                      fallback.textContent = 'SH'
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </div>
              
              {/* Brand Text - Always visible */}
              <div className="flex flex-col">
                <span className="font-semibold text-xs sm:text-base leading-none text-foreground">
                  StudyHub DIU
                </span>
                <span className="text-[8px] sm:text-[10px] text-muted-foreground font-normal uppercase tracking-wider leading-none mt-0.5 sm:mt-1">
                  Learning Platform
                </span>
              </div>
            </button>
          </div>

          {/* Center Section - Navigation (Hidden on mobile) */}
          <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "text-sm font-medium px-5 h-10 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold shadow-sm" 
                      : "hover:bg-accent/60 text-foreground/80 hover:text-foreground"
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {item.name}
                </Button>
              )
            })}
          </nav>

          {/* Right Section - Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl hover:bg-accent/60 transition-all duration-200 hover:scale-105"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Profile Dropdown */}
            <div className="relative hidden sm:block" ref={profileRef}>
              <Button
                variant="ghost"
                className="h-10 px-3 rounded-xl hover:bg-accent/60 transition-all duration-200 flex items-center gap-2.5 hover:scale-105"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  isProfileOpen && "rotate-180"
                )} />
              </Button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                    <p className="font-semibold text-base">Student Name</p>
                    <p className="text-xs text-muted-foreground mt-1">student@diu.edu.bd</p>
                  </div>
                  <div className="py-2 px-2">
                    <button
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent/60 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                      onClick={() => {
                        handleNavigation("/profile")
                        setIsProfileOpen(false)
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span>My Profile</span>
                    </button>
                    <button
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent/60 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                      onClick={() => {
                        handleNavigation("/settings")
                        setIsProfileOpen(false)
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings className="h-4 w-4 text-primary" />
                      </div>
                      <span>Settings</span>
                    </button>
                  </div>
                  <div className="border-t border-border/50 p-2">
                    <button
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-destructive/10 rounded-lg text-destructive transition-all duration-200 flex items-center gap-3 font-medium"
                      onClick={() => {
                        // Add logout logic here
                        setIsProfileOpen(false)
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <LogOut className="h-4 w-4 text-destructive" />
                      </div>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Profile Icon */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden w-10 h-10 rounded-xl hover:bg-accent/60 transition-all duration-200 hover:scale-105"
              onClick={() => handleNavigation("/profile")}
              title="Profile"
            >
              <User className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-10 h-10 rounded-xl hover:bg-accent/60 transition-all duration-200 hover:scale-105"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border/30 bg-background/98 backdrop-blur-xl animate-in slide-in-from-top duration-200 shadow-lg">
          <div className="container mx-auto px-4 py-5">
            <nav className="flex flex-col gap-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className={cn(
                      "justify-start text-sm font-medium px-5 py-3.5 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold shadow-sm" 
                        : "hover:bg-accent/60 text-foreground/80"
                    )}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center mr-3",
                      isActive ? "bg-primary/15" : "bg-accent/30"
                    )}>
                      {Icon && <Icon className="h-4 w-4" />}
                    </div>
                    {item.name}
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
