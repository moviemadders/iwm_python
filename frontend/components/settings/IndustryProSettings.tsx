"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Briefcase } from "lucide-react"
import { getRoleProfile, updateRoleProfile } from "@/utils/api/roles"
import { industryProSettingsSchema, type IndustryProSettingsFormData } from "@/utils/validation/role-settings"

export function IndustryProSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<IndustryProSettingsFormData>({
    resolver: zodResolver(industryProSettingsSchema),
  })

  const acceptingProjects = watch("accepting_projects")

  // Fetch industry profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const profile = await getRoleProfile("industry")
        if (profile) {
          reset({
            handle: profile.handle || "",
            company_name: profile.company_name || "",
            job_title: profile.job_title || "",
            bio: profile.bio || "",
            website_url: profile.website_url || "",
            imdb_url: profile.imdb_url || "",
            linkedin_url: profile.linkedin_url || "",
            experience_years: profile.experience_years || 0,
            accepting_projects: profile.accepting_projects !== false,
          })
        }
      } catch (error) {
        console.error("Failed to fetch industry profile:", error)
        toast({
          title: "Error",
          description: "Failed to load industry settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [reset, toast])

  const onSubmit = async (data: IndustryProSettingsFormData) => {
    try {
      setIsSaving(true)
      await updateRoleProfile("industry", data)
      toast({
        title: "Success",
        description: "Industry settings updated successfully",
      })
    } catch (error) {
      console.error("Failed to update industry settings:", error)
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
          <Briefcase className="h-5 w-5 text-green-500" />
          Industry Professional Settings
        </CardTitle>
        <CardDescription>Manage your industry professional profile and contact information</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Handle */}
          <div className="space-y-2">
            <Label htmlFor="handle">Industry Handle</Label>
            <Input
              id="handle"
              placeholder="Unique industry handle"
              className="bg-gray-700 border-gray-600 text-gray-100"
              {...register("handle")}
            />
            {errors.handle && <p className="text-sm text-red-500">{errors.handle.message}</p>}
          </div>

          {/* Company & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                placeholder="Your company or studio"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("company_name")}
              />
              {errors.company_name && <p className="text-sm text-red-500">{errors.company_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                placeholder="e.g., Producer, Director"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("job_title")}
              />
              {errors.job_title && <p className="text-sm text-red-500">{errors.job_title.message}</p>}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your professional background and expertise..."
              className="bg-gray-700 border-gray-600 text-gray-100"
              {...register("bio")}
            />
            {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
          </div>

          {/* Professional Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-100">Professional Links</h3>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                placeholder="https://yourcompany.com"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("website_url")}
              />
              {errors.website_url && <p className="text-sm text-red-500">{errors.website_url.message}</p>}
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

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                className="bg-gray-700 border-gray-600 text-gray-100"
                {...register("linkedin_url")}
              />
              {errors.linkedin_url && <p className="text-sm text-red-500">{errors.linkedin_url.message}</p>}
            </div>
          </div>

          {/* Experience & Availability */}
          <div className="space-y-4">
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="accepting_projects"
                checked={acceptingProjects}
                {...register("accepting_projects")}
              />
              <Label htmlFor="accepting_projects" className="cursor-pointer">
                Currently accepting new projects
              </Label>
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
              "Save Industry Settings"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

