"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { apiGet, apiPut } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

interface PreferencesData {
  language: string
  region: string
  hideSpoilers: boolean
  excludedGenres: string[]
  contentRating: string
}

export function PreferencesSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [preferences, setPreferences] = useState<PreferencesData | null>(null)
  const [originalPreferences, setOriginalPreferences] = useState<PreferencesData | null>(null)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true)
        const data = await apiGet<PreferencesData>("/api/v1/settings/preferences")
        setPreferences(data)
        setOriginalPreferences(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load preferences",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [toast])

  const handleLanguageChange = (value: string) => {
    if (preferences) {
      setPreferences({ ...preferences, language: value })
    }
  }

  const handleRegionChange = (value: string) => {
    if (preferences) {
      setPreferences({ ...preferences, region: value })
    }
  }

  const handleContentRatingChange = (value: string) => {
    if (preferences) {
      setPreferences({ ...preferences, contentRating: value })
    }
  }

  const handleSpoilersChange = (checked: boolean) => {
    if (preferences) {
      setPreferences({ ...preferences, hideSpoilers: checked })
    }
  }

  const handleSave = async () => {
    if (!preferences) return

    setIsSaving(true)
    try {
      const updated = await apiPut<PreferencesData>("/api/v1/settings/preferences", preferences)
      setPreferences(updated)
      setOriginalPreferences(updated)
      toast({
        title: "Success",
        description: "Preferences updated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700 text-gray-100">
        <CardHeader>
          <CardTitle>Content Preferences</CardTitle>
          <CardDescription className="text-gray-400">
            Customize your content recommendations and viewing experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!preferences) return null

  const isDirty = JSON.stringify(preferences) !== JSON.stringify(originalPreferences)

  return (
    <Card className="bg-gray-800 border-gray-700 text-gray-100">
      <CardHeader>
        <CardTitle>Content Preferences</CardTitle>
        <CardDescription className="text-gray-400">
          Customize your content recommendations and viewing experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="language" className="text-gray-300">
              Language
            </Label>
            <Select value={preferences.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="region" className="text-gray-300">
              Region
            </Label>
            <Select value={preferences.region} onValueChange={handleRegionChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="contentRating" className="text-gray-300">
            Content Rating
          </Label>
          <Select value={preferences.contentRating} onValueChange={handleContentRatingChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="G">G - General Audiences</SelectItem>
              <SelectItem value="PG">PG - Parental Guidance</SelectItem>
              <SelectItem value="PG-13">PG-13 - Parents Strongly Cautioned</SelectItem>
              <SelectItem value="R">R - Restricted</SelectItem>
              <SelectItem value="NC-17">NC-17 - Adults Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hideSpoilers"
            checked={preferences.hideSpoilers}
            onCheckedChange={handleSpoilersChange}
            className="border-gray-600"
          />
          <Label htmlFor="hideSpoilers" className="text-gray-300 cursor-pointer">
            Hide spoilers in recommendations
          </Label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="bg-sky-600 hover:bg-sky-500 text-white gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          {isDirty && (
            <Button
              variant="outline"
              onClick={() => setPreferences(originalPreferences)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

