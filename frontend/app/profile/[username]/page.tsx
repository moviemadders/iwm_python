"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileNavigation } from "@/components/profile/profile-navigation"
import { ProfileOverview } from "@/components/profile/sections/profile-overview"
import { ProfileReviews } from "@/components/profile/sections/profile-reviews"
import { ProfileWatchlist } from "@/components/profile/sections/profile-watchlist"
import { ProfileFavorites } from "@/components/profile/sections/profile-favorites"
import { ProfileCollections } from "@/components/profile/sections/profile-collections"
import { ProfileHistory } from "@/components/profile/sections/profile-history"
import { ProfileSettings } from "@/components/profile/sections/profile-settings"
import { ProfilePulses } from "@/components/profile/sections/profile-pulses"
import { Loader2 } from "lucide-react"
import { updateUserProfile } from "@/lib/api/profile"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { getApiUrl } from "@/lib/api-config"

type ProfileSection = "overview" | "pulse" | "reviews" | "watchlist" | "favorites" | "collections" | "history" | "settings"

interface UserData {
  id: string
  username: string
  name: string
  email: string
  bio: string
  avatarUrl: string
  bannerUrl: string
  joinedDate: string
  location: string
  website: string
  stats: {
    reviews: number
    watchlist: number
    favorites: number
    collections: number
    following: number
    followers: number
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const username = params.username as string
  const { toast } = useToast()

  const [activeSection, setActiveSection] = useState<ProfileSection>("overview")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const handleProfileUpdate = async (data: {
    name: string
    bio: string
    location?: string
    website?: string
    avatarUrl?: string
    bannerUrl?: string
  }) => {
    if (!userData) return

    try {
      await updateUserProfile(userData.id, data)

      // Update local state
      setUserData({
        ...userData,
        name: data.name,
        bio: data.bio,
        location: data.location || "",
        website: data.website || "",
        avatarUrl: data.avatarUrl || userData.avatarUrl,
        bannerUrl: data.bannerUrl || userData.bannerUrl,
      })

      // Refresh the full profile data from server after avatar or banner upload
      if (data.avatarUrl || data.bannerUrl) {
        const apiBase = getApiUrl()
        const response = await fetch(`${apiBase}/api/v1/users/${username}`, {
          cache: "no-store",
        })
        if (response.ok) {
          const freshData = await response.json()
          const transformedUserData: UserData = {
            id: freshData.id || freshData.external_id,
            username: freshData.username || username,
            name: freshData.name || freshData.display_name || username,
            email: freshData.email || "",
            bio: freshData.bio || "",
            avatarUrl: freshData.avatar_url || freshData.avatarUrl || "/placeholder.svg?height=120&width=120",
            bannerUrl: freshData.banner_url || freshData.bannerUrl || "/movie-backdrop.png",
            joinedDate: freshData.joined_date || freshData.created_at || "",
            location: freshData.location || "",
            website: freshData.website || "",
            stats: {
              reviews: freshData.stats?.reviews || freshData.review_count || 0,
              watchlist: freshData.stats?.watchlist || freshData.watchlist_count || 0,
              favorites: freshData.stats?.favorites || freshData.favorites_count || 0,
              collections: freshData.stats?.collections || freshData.collections_count || 0,
              following: freshData.stats?.following || freshData.following_count || 0,
              followers: freshData.stats?.followers || freshData.followers_count || 0,
            },
          }
          setUserData(transformedUserData)
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const apiBase = getApiUrl()

        // Fetch user profile from backend
        const response = await fetch(`${apiBase}/api/v1/users/${username}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found")
          } else {
            setError("Failed to load user profile. Please try again.")
          }
          setIsLoading(false)
          return
        }

        const data = await response.json()

        // Transform backend data to match component expectations
        const transformedUserData: UserData = {
          id: data.id || data.external_id,
          username: data.username || username,
          name: data.name || data.display_name || username,
          email: data.email || "",
          bio: data.bio || "",
          avatarUrl: data.avatar_url || data.avatarUrl || "/placeholder.svg?height=120&width=120",
          bannerUrl: data.banner_url || data.bannerUrl || "/movie-backdrop.png",
          joinedDate: data.joined_date || data.created_at || "",
          location: data.location || "",
          website: data.website || "",
          stats: {
            reviews: data.stats?.reviews || data.review_count || 0,
            watchlist: data.stats?.watchlist || data.watchlist_count || 0,
            favorites: data.stats?.favorites || data.favorites_count || 0,
            collections: data.stats?.collections || data.collections_count || 0,
            following: data.stats?.following || data.following_count || 0,
            followers: data.stats?.followers || data.followers_count || 0,
          },
        }

        setUserData(transformedUserData)
      } catch (err) {
        console.error("Failed to fetch user data:", err)
        setError("Failed to load user profile. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (username) {
      fetchUserData()
    }

  }, [username])

  // Check if current user owns this profile
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const currentUser = await getCurrentUser()
        console.log("Profile Ownership Check:", {
          currentUsername: currentUser?.username,
          pageUsername: username,
          match: currentUser && currentUser.username === username
        })

        if (currentUser && currentUser.username === username) {
          setIsOwnProfile(true)
        } else {
          setIsOwnProfile(false)
        }
      } catch (error) {
        console.error("Ownership check failed:", error)
        // User not logged in
        setIsOwnProfile(false)
      }
    }

    if (username) {
      checkOwnership()
    }
  }, [username])

  // Allow deep-linking to specific section via ?section=...
  useEffect(() => {
    const sectionParam = (searchParams?.get('section') || '').toLowerCase()
    const valid = ["overview", "pulse", "reviews", "watchlist", "favorites", "collections", "playlists", "history", "settings"] as const
    if (sectionParam && (valid as readonly string[]).includes(sectionParam) && sectionParam !== activeSection) {
      setActiveSection(sectionParam as ProfileSection)
    }
  }, [searchParams])

  const renderSection = () => {
    if (!userData) return null

    switch (activeSection) {
      case "overview":
        return <ProfileOverview userId={userData.id} />
      case "pulse":
        return <ProfilePulses userId={userData.id} />
      case "reviews":

        return <ProfileReviews userId={userData.id} />
      case "watchlist":
        return <ProfileWatchlist userId={userData.id} />
      case "favorites":
        return <ProfileFavorites userId={userData.id} />
      case "collections":
        return <ProfileCollections userId={userData.id} />
      case "history":
        return <ProfileHistory userId={userData.id} />
      case "settings":
        return <ProfileSettings userId={userData.id} />
      default:
        return <ProfileOverview userId={userData.id} />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#00BFFF] animate-spin" />
          <p className="text-[#E0E0E0] font-dm-sans text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-inter font-bold text-[#E0E0E0] mb-4">
            {error || "User not found"}
          </h1>
          <p className="text-[#A0A0A0] font-dm-sans mb-6">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-[#00BFFF] text-white font-dm-sans font-medium rounded-lg hover:bg-[#00BFFF]/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Profile Header */}
      <ProfileHeader
        name={userData.name}
        username={userData.username}
        bio={userData.bio}
        avatarUrl={userData.avatarUrl}
        bannerUrl={userData.bannerUrl}
        joinedDate={userData.joinedDate}
        location={userData.location}
        website={userData.website}
        stats={userData.stats}
        isOwnProfile={isOwnProfile}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Profile Navigation */}
      <div className="border-b border-[#3A3A3A] sticky top-0 bg-[#0f0f0f] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProfileNavigation
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            stats={userData.stats}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderSection()}
        </motion.div>
      </div>
    </div>
  )
}

