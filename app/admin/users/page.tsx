"use client"

import { useState, useEffect, useCallback, useMemo, memo, useTransition } from "react"
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Shield, 
  User, 
  MoreHorizontal,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Clock,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

// Types
interface Batch {
  id: string
  batch_number: number
  batch_name: string
}

interface UserData {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  student_id: string | null
  batch_id: string | null
  is_active: boolean
  is_approved: boolean
  last_login: string | null
  login_count: number
  created_at: string
  updated_at: string
  batches: Batch | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Constants - moved outside component to prevent recreation
const ROLES = [
  { value: "super_admin", label: "Super Admin", color: "bg-red-500" },
  { value: "admin", label: "Admin", color: "bg-orange-500" },
  { value: "moderator", label: "Moderator", color: "bg-yellow-500" },
  { value: "content_creator", label: "Content Creator", color: "bg-blue-500" },
  { value: "section_admin", label: "Section Admin", color: "bg-purple-500" },
  { value: "contributor", label: "Contributor", color: "bg-green-500" },
] as const

const ROLE_MAP = new Map(ROLES.map(r => [r.value, r]))

// Memoized Components
const UserAvatar = memo(({ user }: { user: UserData }) => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
    {user.avatar_url ? (
      <img 
        src={user.avatar_url} 
        alt={user.full_name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ) : (
      user.full_name.charAt(0).toUpperCase()
    )}
  </div>
))
UserAvatar.displayName = "UserAvatar"

const RoleBadge = memo(({ role }: { role: string }) => {
  const roleConfig = ROLE_MAP.get(role)
  return (
    <Badge 
      variant="secondary" 
      className={`${roleConfig?.color || "bg-gray-500"} text-white`}
    >
      {roleConfig?.label || role}
    </Badge>
  )
})
RoleBadge.displayName = "RoleBadge"

const StatusBadge = memo(({ user }: { user: UserData }) => {
  if (!user.is_approved) {
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }
  if (!user.is_active) {
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-green-600 border-green-600">
      <CheckCircle className="w-3 h-3 mr-1" />
      Active
    </Badge>
  )
})
StatusBadge.displayName = "StatusBadge"

const StatsCard = memo(({ title, value, icon: Icon, color }: { 
  title: string
  value: number
  icon: React.ElementType
  color?: string 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color?.replace("text-", "text-") || ""}`}>
        {value}
      </div>
    </CardContent>
  </Card>
))
StatsCard.displayName = "StatsCard"

// Loading skeleton for table rows
const TableRowSkeleton = memo(() => (
  <TableRow>
    <TableCell>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </TableCell>
    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
  </TableRow>
))
TableRowSkeleton.displayName = "TableRowSkeleton"

// Date formatter with caching
const dateFormatCache = new Map<string, string>()
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Never"
  
  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString)!
  }
  
  const formatted = new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
  
  dateFormatCache.set(dateString, formatted)
  return formatted
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// User Row Component
const UserRow = memo(({ 
  user, 
  onApprove, 
  onToggleActive,
  onChangeRole,
  onDelete,
  actionLoading,
  processingUserId
}: { 
  user: UserData
  onApprove: (user: UserData, approve: boolean) => void
  onToggleActive: (user: UserData) => void
  onChangeRole: (user: UserData) => void
  onDelete: (user: UserData) => void
  actionLoading: boolean
  processingUserId: string | null
}) => {
  const isProcessing = processingUserId === user.id
  
  return (
    <TableRow className={isProcessing ? "opacity-50" : ""}>
      <TableCell>
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
          <div>
            <div className="font-medium">{user.full_name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            {user.student_id && (
              <div className="text-xs text-muted-foreground">ID: {user.student_id}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell><RoleBadge role={user.role} /></TableCell>
      <TableCell>
        {user.batches ? (
          <Badge variant="outline">Batch {user.batches.batch_number}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell><StatusBadge user={user} /></TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(user.created_at)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(user.last_login)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {!user.is_approved && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:bg-green-50"
              onClick={() => onApprove(user, true)}
              disabled={actionLoading}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4 mr-1" />
              )}
              Approve
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isProcessing}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangeRole(user)}>
                <Shield className="w-4 h-4 mr-2" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(user)}>
                {user.is_active ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              {user.is_approved && (
                <DropdownMenuItem 
                  onClick={() => onApprove(user, false)}
                  className="text-yellow-600"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Revoke Approval
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(user)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
})
UserRow.displayName = "UserRow"

// Main Component
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [roleFilter, setRoleFilter] = useState("all")
  const [approvalFilter, setApprovalFilter] = useState("all")
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newRole, setNewRole] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)
  
  // React 18 transition for non-blocking updates
  const [, startTransition] = useTransition()
  
  const { toast } = useToast()

  // Memoized stats calculations
  const stats = useMemo(() => ({
    pending: users.filter(u => !u.is_approved).length,
    active: users.filter(u => u.is_active && u.is_approved).length,
    contributors: users.filter(u => u.role === "contributor").length
  }), [users])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (roleFilter !== "all") params.append("role", roleFilter)
      if (approvalFilter !== "all") params.append("is_approved", approvalFilter)
      if (debouncedSearch) params.append("search", debouncedSearch)

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        startTransition(() => {
          setUsers(data.users)
          setPagination(data.pagination)
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch users",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, roleFilter, approvalFilter, debouncedSearch, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Optimistic update for approve/reject
  const handleApprove = useCallback(async (user: UserData, approve: boolean) => {
    setActionLoading(true)
    setProcessingUserId(user.id)
    
    // Optimistic update
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, is_approved: approve } : u
    ))
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          updates: { is_approved: approve }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `User ${approve ? "approved" : "rejected"} successfully`,
        })
      } else {
        // Revert optimistic update
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, is_approved: !approve } : u
        ))
        toast({
          title: "Error",
          description: data.error || "Failed to update user",
          variant: "destructive"
        })
      }
    } catch (error) {
      // Revert optimistic update
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, is_approved: !approve } : u
      ))
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
      setProcessingUserId(null)
    }
  }, [toast])

  const handleRoleChange = useCallback(async () => {
    if (!selectedUser || !newRole) return
    
    setActionLoading(true)
    const oldRole = selectedUser.role
    
    // Optimistic update
    setUsers(prev => prev.map(u => 
      u.id === selectedUser.id ? { ...u, role: newRole } : u
    ))
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          updates: { role: newRole }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "User role updated successfully" })
        setShowRoleDialog(false)
        setSelectedUser(null)
        setNewRole("")
      } else {
        // Revert
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, role: oldRole } : u
        ))
        toast({
          title: "Error",
          description: data.error || "Failed to update role",
          variant: "destructive"
        })
      }
    } catch (error) {
      setUsers(prev => prev.map(u => 
        u.id === selectedUser!.id ? { ...u, role: oldRole } : u
      ))
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }, [selectedUser, newRole, toast])

  const handleToggleActive = useCallback(async (user: UserData) => {
    setActionLoading(true)
    setProcessingUserId(user.id)
    const newActive = !user.is_active
    
    // Optimistic update
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, is_active: newActive } : u
    ))
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          updates: { is_active: newActive }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `User ${newActive ? "activated" : "deactivated"} successfully`,
        })
      } else {
        // Revert
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, is_active: !newActive } : u
        ))
        toast({
          title: "Error",
          description: data.error || "Failed to update user",
          variant: "destructive"
        })
      }
    } catch (error) {
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, is_active: !newActive } : u
      ))
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
      setProcessingUserId(null)
    }
  }, [toast])

  const handleDelete = useCallback(async () => {
    if (!selectedUser) return
    
    setActionLoading(true)
    const deletedUser = selectedUser
    
    // Optimistic update
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
    
    try {
      const response = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "User deleted successfully" })
        setShowDeleteDialog(false)
        setSelectedUser(null)
      } else {
        // Revert
        setUsers(prev => [...prev, deletedUser])
        toast({
          title: "Error",
          description: data.error || "Failed to delete user",
          variant: "destructive"
        })
      }
    } catch (error) {
      setUsers(prev => [...prev, deletedUser])
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }, [selectedUser, toast])

  const openRoleDialog = useCallback((user: UserData) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowRoleDialog(true)
  }, [])

  const openDeleteDialog = useCallback((user: UserData) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(p => ({ ...p, page: newPage }))
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage users, approve registrations, and assign roles
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Users" value={pagination.total} icon={Users} />
        <StatsCard title="Pending Approval" value={stats.pending} icon={AlertCircle} color="text-yellow-500" />
        <StatsCard title="Active Users" value={stats.active} icon={CheckCircle} color="text-green-500" />
        <StatsCard title="Contributors" value={stats.contributors} icon={User} color="text-blue-500" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Approved</SelectItem>
                <SelectItem value="false">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onApprove={handleApprove}
                    onToggleActive={handleToggleActive}
                    onChangeRole={openRoleDialog}
                    onDelete={openDeleteDialog}
                    actionLoading={actionLoading}
                    processingUserId={processingUserId}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.full_name}. This will affect their permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${role.color}`} />
                      {role.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={actionLoading || !newRole}>
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
