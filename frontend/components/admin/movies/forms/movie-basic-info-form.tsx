"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useState } from "react"
import { type Movie, type MovieStatus, ALL_GENRES, ALL_LANGUAGES, ALL_STATUSES, ALL_CERTIFICATIONS } from "@/types"

interface MovieBasicInfoFormProps {
  movie: Partial<Movie>
  onFieldChange: (fieldName: keyof Movie, value: any) => void
  onChanges: () => void
}

export function MovieBasicInfoForm({ movie, onFieldChange, onChanges }: MovieBasicInfoFormProps) {
  const [genres, setGenres] = useState<string[]>(movie.genres || [])
  const [languages, setLanguages] = useState<string[]>(movie.languages || [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={movie.title || ""}
              onChange={(e) => {
                onFieldChange("title", e.target.value)
                onChanges()
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="original-title">Original Title</Label>
            <Input
              id="original-title"
              value={movie.originalTitle || ""}
              onChange={(e) => {
                onFieldChange("originalTitle", e.target.value)
                onChanges()
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="synopsis">Synopsis</Label>
          <Textarea
            id="synopsis"
            rows={4}
            value={movie.synopsis || ""}
            onChange={(e) => {
              onFieldChange("synopsis", e.target.value)
              onChanges()
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="release-date">Release Date</Label>
            <Input
              id="release-date"
              type="date"
              value={movie.releaseDate || ""}
              onChange={(e) => {
                onFieldChange("releaseDate", e.target.value)
                onChanges()
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="runtime">Runtime (minutes)</Label>
            <Input
              id="runtime"
              type="number"
              value={movie.runtime || 0}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value)
                onFieldChange("runtime", isNaN(value) ? 0 : value)
                onChanges()
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={movie.status || "released"}
              onValueChange={(value) => {
                onFieldChange("status", value as MovieStatus)
                onChanges()
              }}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Genres</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {genres.map((genre) => (
              <Badge key={genre} variant="secondary" className="gap-1">
                {genre}
                <button
                  onClick={() => {
                    const newGenres = genres.filter((g) => g !== genre)
                    setGenres(newGenres)
                    onFieldChange("genres", newGenres)
                    onChanges()
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
          </div>
          <Select
            onValueChange={(value) => {
              if (!genres.includes(value)) {
                const newGenres = [...genres, value]
                setGenres(newGenres)
                onFieldChange("genres", newGenres)
                onChanges()
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add genre" />
            </SelectTrigger>
            <SelectContent>
              {ALL_GENRES.filter((g) => !genres.includes(g)).map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Languages</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {languages.map((language) => (
              <Badge key={language} variant="secondary" className="gap-1">
                {language}
                <button
                  onClick={() => {
                    const newLanguages = languages.filter((l) => l !== language)
                    setLanguages(newLanguages)
                    onFieldChange("languages", newLanguages)
                    onChanges()
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
          </div>
          <Select
            onValueChange={(value) => {
              if (!languages.includes(value)) {
                const newLanguages = [...languages, value]
                setLanguages(newLanguages)
                onFieldChange("languages", newLanguages)
                onChanges()
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add language" />
            </SelectTrigger>
            <SelectContent>
              {ALL_LANGUAGES.filter((l) => !languages.includes(l)).map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="siddu-score">SidduScore</Label>
            <Input
              id="siddu-score"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={movie.sidduScore || 0}
              onChange={(e) => {
                const value = Number.parseFloat(e.target.value)
                onFieldChange("sidduScore", isNaN(value) ? 0 : value)
                onChanges()
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certification">Certification</Label>
            <Select
              value={movie.certification || "pg-13"}
              onValueChange={(value) => {
                onFieldChange("certification", value)
                onChanges()
              }}
            >
              <SelectTrigger id="certification">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CERTIFICATIONS.map((certification) => (
                  <SelectItem key={certification} value={certification}>
                    {certification}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Video Playback Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Video Playback</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=... or direct video URL"
                value={(movie as any).videoUrl || ""}
                onChange={(e) => {
                  onFieldChange("videoUrl" as any, e.target.value)
                  onChanges()
                }}
              />
              <p className="text-xs text-muted-foreground">
                YouTube URL or direct video file URL
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="video-source">Video Source</Label>
              <Select
                value={(movie as any).videoSource || "youtube"}
                onValueChange={(value) => {
                  onFieldChange("videoSource" as any, value)
                  onChanges()
                }}
              >
                <SelectTrigger id="video-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="direct">Direct Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is-free"
              checked={(movie as any).isFree || false}
              onChange={(e) => {
                onFieldChange("isFree" as any, e.target.checked)
                onChanges()
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is-free" className="cursor-pointer">
              Free to watch (no subscription required)
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
