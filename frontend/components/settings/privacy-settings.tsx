// This file already exists and should have the correct export.
// Ensuring it's here for completeness if it was accidentally removed.
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, EyeOff, Users, Lock, Loader2 } from "lucide-react"
import { apiGet, apiPut } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface PrivacySettingsData {
  profileVisibility: "public" | "followers" | "private"
  activitySharing: boolean
  messageRequests: "everyone" | "followers" | "none"
  dataDownloadRequested: boolean
}

export function PrivacySettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<PrivacySettingsData | null>(null)
  const [originalSettings, setOriginalSettings] = useState<PrivacySettingsData | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const data = await apiGet<PrivacySettingsData>("/api/v1/settings/privacy")
        setSettings(data)
        setOriginalSettings(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load privacy settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  const handleSettingChange = (key: keyof PrivacySettingsData, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
    }
  }

  const handleSaveChanges = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const updated = await apiPut<PrivacySettingsData>("/api/v1/settings/privacy", settings)
      setSettings(updated)
      setOriginalSettings(updated)
      toast({
        title: "Success",
        description: "Privacy settings updated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDataDownload = () => {
    handleSettingChange("dataDownloadRequested", true)
    toast({
      title: "Request Submitted",
      description: "You'll receive an email when your data is ready.",
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700 text-gray-100">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <ShieldCheck className="h-6 w-6 mr-2 text-sky-400" /> Privacy Settings
          </CardTitle>
          <CardDescription className="text-gray-400">Control your privacy and data sharing preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!settings) return null

  const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  return (
    <Card className="bg-gray-800 border-gray-700 text-gray-100">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <ShieldCheck className="h-6 w-6 mr-2 text-sky-400" /> Privacy Settings
        </CardTitle>
        <CardDescription className="text-gray-400">Control your privacy and data sharing preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center">
            <Users className="h-5 w-5 mr-2 text-sky-300" />
            Profile Visibility
          </h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="profileVisibility" className="text-gray-300">
              Who can see your profile?
            </Label>
            <Select
              value={settings.profileVisibility}
              onValueChange={(value) => handleSettingChange("profileVisibility", value)}
            >
              <SelectTrigger id="profileVisibility" className="w-[180px] bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="followers">Followers Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-500">
            {settings.profileVisibility === "public" && "Anyone can see your profile, activity, and lists."}
            {settings.profileVisibility === "followers" && "Only users you approve to follow you can see your details."}
            {settings.profileVisibility === "private" &&
              "Your profile is hidden. You'll need to approve follow requests."}
          </p>
        </div>

        <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center">
            <EyeOff className="h-5 w-5 mr-2 text-sky-300" />
            Activity Sharing
          </h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="activitySharing" className="text-gray-300">
              Share my watch activity with followers
            </Label>
            <Switch
              id="activitySharing"
              checked={settings.activitySharing}
              onCheckedChange={(checked) => handleSettingChange("activitySharing", checked)}
              className="data-[state=checked]:bg-sky-500"
            />
          </div>
          <p className="text-xs text-gray-500">If enabled, your followers can see movies you've watched or rated.</p>
        </div>

        <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center">
            <Lock className="h-5 w-5 mr-2 text-sky-300" />
            Message Requests
          </h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="messageRequests" className="text-gray-300">
              Allow message requests from:
            </Label>
            <Select
              value={settings.messageRequests}
              onValueChange={(value) => handleSettingChange("messageRequests", value)}
            >
              <SelectTrigger id="messageRequests" className="w-[180px] bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select who can message" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers Only</SelectItem>
                <SelectItem value="none">No One</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-500">Control who can send you direct messages on the platform.</p>
        </div>

        <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-200">Data Management</h3>
          <Button
            variant="outline"
            onClick={handleDataDownload}
            disabled={settings.dataDownloadRequested}
            className="border-sky-500 text-sky-500 hover:bg-sky-500/10 hover:text-sky-400"
          >
            {settings.dataDownloadRequested ? "Download Requested" : "Request My Data"}
          </Button>
          <p className="text-xs text-gray-500">Request a copy of your personal data stored on Siddu.</p>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-700 pt-6 flex gap-3">
        <Button
          onClick={handleSaveChanges}
          disabled={isSaving || !isDirty}
          className="bg-sky-600 hover:bg-sky-500 text-white gap-2"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save Privacy Settings"}
        </Button>
        {isDirty && (
          <Button
            variant="outline"
            onClick={() => setSettings(originalSettings)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
