"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Star } from "lucide-react"
import { getRoleProfile, updateRoleProfile } from "@/utils/api/roles"
import { criticSettingsSchema, type CriticSettingsFormData } from "@/utils/validation/role-settings"

export function CriticSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CriticSettingsFormData>({
    resolver: zodResolver(criticSettingsSchema),
  })

  // Fetch critic profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const profile = await getRoleProfile("critic")
        if (profile) {
          reset({
            handle: profile.handle || "",
            bio: profile.bio || "",
            twitter_url: profile.twitter_url || "",
            letterboxd_url: profile.letterboxd_url || "",
            personal_website: profile.personal_website || "",
            review_visibility: profile.review_visibility || "public",
            allow_comments: profile.allow_comments !== false,
          })
        }
      } catch (error) {
        console.error("Failed to fetch critic profile:", error)
        toast({
          title: "Error",
          description: "Failed to load critic settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [reset, toast])

  const onSubmit = async (data: CriticSettingsFormData) => {
    try {
      setIsSaving(true)
      await updateRoleProfile("critic", data)
      toast({
        title: "Success",
        description: "Critic settings updated successfully",
      })
    } catch (error) {
      console.error("Failed to update critic settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Critic Profile Settings
        </CardTitle>
        <CardDescription>Manage your critic profile and review preferences</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Handle / Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="handle">Channel Name / Handle</Label>
            <Input
              id="handle"
              placeholder="Unique critic handle (e.g. BestMoviesChannel)"
              className="bg-gray-700 border-gray-600 text-gray-100"
              {...register("handle")}
            />
            {errors.handle && <p className="text-sm text-red-500">{errors.handle.message}</p>}
            <p className="text-xs text-gray-400">Unique identifier for your critic profile.</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your critical perspective..."
              className="bg-gray-700 border-gray-600 text-gray-100"
              {...register("bio")}
            />
            {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-100">Social Media Links</h3>

            <div className="space-y-2">
              <Label htmlFor="twitter_url">Twitter URL</Label>
              <Input
                id="twitter_url"
                type="url"
                placeholder="https://twitter.com/yourhandle"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("twitter_url")}
              />
              {errors.twitter_url && <p className="text-sm text-red-500">{errors.twitter_url.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="letterboxd_url">Letterboxd URL</Label>
              <Input
                id="letterboxd_url"
                type="url"
                placeholder="https://letterboxd.com/yourprofile"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("letterboxd_url")}
              />
              {errors.letterboxd_url && <p className="text-sm text-red-500">{errors.letterboxd_url.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="personal_website">Personal Website</Label>
              <Input
                id="personal_website"
                type="url"
                placeholder="https://yourwebsite.com"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("personal_website")}
              />
              {errors.personal_website && <p className="text-sm text-red-500">{errors.personal_website.message}</p>}
            </div>
          </div>

          {/* Save Button */}
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Critic Settings"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

