"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Building2, Users, Eye, Edit3, Filter, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Department {
  id: string
  name: string
  short_name: string
}

interface Batch {
  id: string
  batch_name: string
  batch_number: number
}

interface UserContext {
  role: string
  department_id: string | null
  batch_id: string | null
  department?: Department | null
  batch?: Batch | null
}

interface DepartmentBatchSelectorProps {
  userContext: UserContext | null
  onContextChange: (departmentId: string | null, batchId: string | null) => void
  className?: string
}

export function DepartmentBatchSelector({
  userContext,
  onContextChange,
  className,
}: DepartmentBatchSelectorProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const isContributor = userContext?.role === "contributor"
  const isAdmin = ["super_admin", "admin", "moderator", "content_creator", "section_admin"].includes(userContext?.role || "")

  // Initialize with user's assigned department/batch
  useEffect(() => {
    if (userContext) {
      setSelectedDepartmentId(userContext.department_id)
      setSelectedBatchId(userContext.batch_id)
    }
  }, [userContext])

  // Fetch departments and batches
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [deptRes, batchRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/batches"),
        ])

        if (deptRes.ok) {
          const deptData = await deptRes.json()
          setDepartments(deptData.departments || [])
        }

        if (batchRes.ok) {
          const batchData = await batchRes.json()
          setBatches(batchData.batches || [])
        }
      } catch (error) {
        console.error("Error fetching departments/batches:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDepartmentChange = useCallback((value: string) => {
    const newDeptId = value === "all" ? null : value
    setSelectedDepartmentId(newDeptId)
    onContextChange(newDeptId, selectedBatchId)
  }, [selectedBatchId, onContextChange])

  const handleBatchChange = useCallback((value: string) => {
    const newBatchId = value === "all" ? null : value
    setSelectedBatchId(newBatchId)
    onContextChange(selectedDepartmentId, newBatchId)
  }, [selectedDepartmentId, onContextChange])

  const resetToUserContext = useCallback(() => {
    if (userContext) {
      setSelectedDepartmentId(userContext.department_id)
      setSelectedBatchId(userContext.batch_id)
      onContextChange(userContext.department_id, userContext.batch_id)
    }
  }, [userContext, onContextChange])

  // Check if viewing own context (can edit)
  const isViewingOwnContext = 
    selectedDepartmentId === userContext?.department_id && 
    selectedBatchId === userContext?.batch_id

  // Get display names
  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId)
  const selectedBatch = batches.find(b => b.id === selectedBatchId)

  const displayText = selectedDepartment && selectedBatch
    ? `${selectedDepartment.short_name} - ${selectedBatch.batch_name}`
    : selectedDepartment
    ? selectedDepartment.short_name
    : selectedBatch
    ? selectedBatch.batch_name
    : "All Content"

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 animate-pulse", className)}>
        <div className="h-9 w-32 bg-muted rounded-md" />
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="justify-between min-w-[200px] gap-2"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{displayText}</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Department
              </label>
              <Select
                value={selectedDepartmentId || "all"}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && (
                    <SelectItem value="all">All Departments</SelectItem>
                  )}
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.short_name} - {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Batch
              </label>
              <Select
                value={selectedBatchId || "all"}
                onValueChange={handleBatchChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && (
                    <SelectItem value="all">All Batches</SelectItem>
                  )}
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isContributor && !isViewingOwnContext && (
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={resetToUserContext}
                >
                  <X className="h-4 w-4" />
                  Reset to My Department/Batch
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Mode indicator badge */}
      {isContributor && (
        <Badge
          variant={isViewingOwnContext ? "default" : "secondary"}
          className={cn(
            "gap-1",
            isViewingOwnContext
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          )}
        >
          {isViewingOwnContext ? (
            <>
              <Edit3 className="h-3 w-3" />
              Edit Mode
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              View Only
            </>
          )}
        </Badge>
      )}
    </div>
  )
}
