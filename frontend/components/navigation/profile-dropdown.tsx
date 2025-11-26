"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, LayoutDashboard, Bell, Heart, ListChecks, ShieldCheck } from "lucide-react"
import { useRoleContext } from "@/context/RoleContext"
import { getProfileRouteForRole } from "@/utils/routing/role-routing"
import { useAdminRole } from "@/hooks/useAdminRole"

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { activeRole, availableRoles, switchRole } = useRoleContext()
  const { isAdmin } = useAdminRole()



  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { me, isAuthenticated } = await import("@/lib/auth")
        if (!isAuthenticated()) {
          setUser(null)
          return
        }
        const userData = await me()
        setUser(userData)
      } catch (error) {
        // Silently handle unauthenticated state without noisy console errors
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      const { logout } = await import("@/lib/auth")
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleProfileClick = () => {
    if (!username) {
      console.error("Username is missing")
      return
    }
    const profileRoute = getProfileRouteForRole(activeRole, username)
    console.log("Navigating to profile:", profileRoute, "for role:", activeRole)
    router.push(profileRoute)
  }

  if (isLoading) {
    return (
      <div className="h-9 w-9 rounded-full bg-[#3A3A3A] animate-pulse" />
    )
  }

  if (!user) {
    return (
      <Link href="/login" passHref legacyBehavior>
        <Button variant="outline" className="text-sm border-primary text-primary hover:bg-primary/10">
          Login
        </Button>
      </Link>
    )
  }

  // Generate username from email (part before @)
  const username = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'user'

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="focus:outline-none rounded-full"
          aria-label="User profile"
        >
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#282828] border-[#3A3A3A] text-white" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-gray-400">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#3A3A3A]" />
        {availableRoles && availableRoles.length > 0 && (
          <>
            <div className="px-2 py-2 text-xs text-gray-400">Switch Role</div>
            {availableRoles.map((role: any) => (
              <DropdownMenuItem
                key={role.role}
                onClick={() => switchRole(role.role as any)}
                className={`cursor-pointer ${role.is_active ? "bg-[#1A1A1A] text-[#00BFFF]" : ""}`}
              >
                <span className="mr-2">{role.is_active ? "✓" : "○"}</span>
                {role.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-[#3A3A3A]" />
          </>
        )}
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer hover:bg-[#3A3A3A] focus:bg-[#3A3A3A]">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <Link href="/watchlist" passHref legacyBehavior>
          <DropdownMenuItem className="cursor-pointer hover:bg-[#3A3A3A] focus:bg-[#3A3A3A]">
            <ListChecks className="mr-2 h-4 w-4" />
            Watchlist
          </DropdownMenuItem>
        </Link>
        <Link href="/favorites" passHref legacyBehavior>
          <DropdownMenuItem className="cursor-pointer hover:bg-[#3A3A3A] focus:bg-[#3A3A3A]">
            <Heart className="mr-2 h-4 w-4" />
            Favorites
          </DropdownMenuItem>
        </Link>
        <Link href="/notifications" passHref legacyBehavior>
          <DropdownMenuItem className="cursor-pointer hover:bg-[#3A3A3A] focus:bg-[#3A3A3A]">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="bg-[#3A3A3A]" />
        {isAdmin && (
          <Link href="/admin" passHref legacyBehavior>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#3A3A3A] focus:bg-[#3A3A3A]">
              <span className="text-red-400">Admin Dashboard</span>
            </DropdownMenuItem>
          </Link>
        )}
        <Link href="/settings" passHref legacyBehavior>
          <DropdownMenuItem className="cursor-pointer hover:bg-[#3A3A3A] focus:bg-[#3A3A3A]">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="bg-[#3A3A3A]" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-400 hover:bg-red-500/20 focus:bg-red-500/20 focus:text-red-300 hover:text-red-300"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
