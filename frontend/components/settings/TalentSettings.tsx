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
import { Loader2, Sparkles } from "lucide-react"
import { getRoleProfile, updateRoleProfile } from "@/utils/api/roles"
import { talentSettingsSchema, type TalentSettingsFormData } from "@/utils/validation/role-settings"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TalentSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TalentSettingsFormData>({
    resolver: zodResolver(talentSettingsSchema),
  })

  const availabilityStatus = watch("availability_status")

  // Fetch talent profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const profile = await getRoleProfile("talent")
        if (profile) {
          reset({
            handle: profile.handle || "",
            stage_name: profile.stage_name || "",
            bio: profile.bio || "",
            headshot_url: profile.headshot_url || "",
            demo_reel_url: profile.demo_reel_url || "",
            imdb_url: profile.imdb_url || "",
            agent_name: profile.agent_name || "",
            agent_contact: profile.agent_contact || "",
            experience_years: profile.experience_years || 0,
            availability_status: profile.availability_status || "available",
          })
        }
      } catch (error) {
        console.error("Failed to fetch talent profile:", error)
        toast({
          title: "Error",
          description: "Failed to load talent settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [reset, toast])

  const onSubmit = async (data: TalentSettingsFormData) => {
    try {
      setIsSaving(true)
      await updateRoleProfile("talent", data)
      toast({
        title: "Success",
        description: "Talent settings updated successfully",
      })
    } catch (error) {
      console.error("Failed to update talent settings:", error)
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
          <Sparkles className="h-5 w-5 text-purple-500" />
          Talent Profile Settings
        </CardTitle>
        <CardDescription>Manage your talent profile and professional information</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Handle */}
          <div className="space-y-2">
            <Label htmlFor="handle">Talent Handle</Label>
            <Input
              id="handle"
              placeholder="Unique talent handle"
              className="bg-gray-700 border-gray-600 text-gray-100"
              {...register("handle")}
            />
            {errors.handle && <p className="text-sm text-red-500">{errors.handle.message}</p>}
          </div>

          {/* Professional Name */}
          <div className="space-y-2">
            <Label htmlFor="stage_name">Stage Name / Professional Name</Label>
            <Input
              id="stage_name"
              placeholder="Your professional name"
              className="bg-gray-700 border-gray-600 text-gray-100"
              {...register("stage_name")}
            />
            {errors.stage_name && <p className="text-sm text-red-500">{errors.stage_name.message}</p>}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your talent and experience..."
              className="bg-gray-700 border-gray-600 text-gray-100"
              {...register("bio")}
            />
            {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
          </div>

          {/* Professional Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-100">Professional Links</h3>

            <div className="space-y-2">
              <Label htmlFor="headshot_url">Headshot URL</Label>
              <Input
                id="headshot_url"
                type="url"
                placeholder="https://example.com/headshot.jpg"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("headshot_url")}
              />
              {errors.headshot_url && <p className="text-sm text-red-500">{errors.headshot_url.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="demo_reel_url">Demo Reel URL</Label>
              <Input
                id="demo_reel_url"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("demo_reel_url")}
              />
              {errors.demo_reel_url && <p className="text-sm text-red-500">{errors.demo_reel_url.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imdb_url">IMDb URL</Label>
              <Input
                id="imdb_url"
                type="url"
                placeholder="https://imdb.com/name/nm..."
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("imdb_url")}
              />
              {errors.imdb_url && <p className="text-sm text-red-500">{errors.imdb_url.message}</p>}
            </div>
          </div>

          {/* Agent Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-100">Agent Information</h3>

            <div className="space-y-2">
              <Label htmlFor="agent_name">Agent Name</Label>
              <Input
                id="agent_name"
                placeholder="Your agent's name"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("agent_name")}
              />
              {errors.agent_name && <p className="text-sm text-red-500">{errors.agent_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_contact">Agent Contact</Label>
              <Input
                id="agent_contact"
                placeholder="Email or phone"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("agent_contact")}
              />
              {errors.agent_contact && <p className="text-sm text-red-500">{errors.agent_contact.message}</p>}
            </div>
          </div>

          {/* Experience & Availability */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                max="100"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("experience_years", { valueAsNumber: true })}
              />
              {errors.experience_years && <p className="text-sm text-red-500">{errors.experience_years.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability_status">Availability Status</Label>
              <Select value={availabilityStatus} onValueChange={(value) => setValue("availability_status", value as any)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="not_available">Not Available</SelectItem>
                </SelectContent>
              </Select>
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
              "Save Talent Settings"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

