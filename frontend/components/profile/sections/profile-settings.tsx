"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, AlertCircle, RotateCcw, Loader2, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  getProfileSettings,
  updateProfileSettings,
} from "@/lib/api/settings"

interface ProfileSettingsProps {
  userId: string
}

export function ProfileSettings({ userId }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Profile Settings
  const [profileData, setProfileData] = useState({
    username: "",
    fullName: "",
    bio: "",
    avatarUrl: "",
  })

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const profile = await getProfileSettings()

        // Update profile settings
        if (profile) {
          setProfileData({
            username: profile.username || "",
            fullName: profile.fullName || "",
            bio: profile.bio || "",
            avatarUrl: profile.avatarUrl || "",
          })
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err)
        setError(err instanceof Error ? err.message : "Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchSettings()
    }
  }, [userId])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await updateProfileSettings(profileData)
      setSuccessMessage("Profile settings saved successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Failed to save profile settings:", err)
      setError(err instanceof Error ? err.message : "Failed to save profile settings")
    } finally {
      setIsSaving(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  if (isLoading) {
    return (
      <div className="bg-[#282828] rounded-lg p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00BFFF] animate-spin mr-2" />
        <span className="text-[#E0E0E0] font-dmsans">Loading settings...</span>
      </div>
    )
  }

  return (
    <motion.div className="bg-[#282828] rounded-lg p-6" initial="hidden" animate="visible" variants={containerVariants}>
      {error && (
        <div className="mb-6 p-4 bg-[#FF4D6D]/10 border border-[#FF4D6D] rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#FF4D6D] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[#FF4D6D] font-dmsans text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 mt-2 px-3 py-1 bg-[#FF4D6D] text-[#000] rounded text-sm hover:bg-[#FF6B7F] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-[#00BFFF]/10 border border-[#00BFFF] rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-[#00BFFF]" />
          <p className="text-[#00BFFF] font-dmsans text-sm">{successMessage}</p>
        </div>
      )}

      <motion.form onSubmit={handleProfileSubmit} className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-inter font-medium text-[#E0E0E0] mb-4">Global Profile Information</h3>
          <p className="text-gray-400 text-sm mb-6">
            This is your global profile visible to everyone. Your role-specific profiles (Critic, Talent, etc.) can have their own unique handles.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-[#E0E0E0]">
                  Username (Global)
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  className="bg-[#1A1A1A] border-[#3A3A3A] text-[#E0E0E0]"
                  placeholder="Unique global username"
                />
                <p className="text-xs text-gray-500 mt-1">Unique across the entire platform.</p>
              </div>

              <div>
                <Label htmlFor="fullName" className="text-[#E0E0E0]">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  className="bg-[#1A1A1A] border-[#3A3A3A] text-[#E0E0E0]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="text-[#E0E0E0]">
                Bio
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleProfileChange}
                className="bg-[#1A1A1A] border-[#3A3A3A] text-[#E0E0E0] h-[calc(100%-28px)]"
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#00BFFF] text-[#1A1A1A] hover:bg-[#00A3DD] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
