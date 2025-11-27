"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MovieBasicInfoForm } from "@/components/admin/movies/forms/movie-basic-info-form"
import { MovieMediaForm } from "@/components/admin/movies/forms/movie-media-form"
import { MovieCastCrewForm } from "@/components/admin/movies/forms/movie-cast-crew-form"
import { MovieStreamingForm } from "@/components/admin/movies/forms/movie-streaming-form"
import { MovieAwardsFormEnhanced } from "@/components/admin/movies/forms/movie-awards-form-enhanced"
import { MovieTriviaForm } from "@/components/admin/movies/forms/movie-trivia-form"
import { MovieTimelineForm } from "@/components/admin/movies/forms/movie-timeline-form"
import { MovieScenesForm } from "@/components/admin/movies/forms/movie-scenes-form"
import { JSONImportModal } from "@/components/admin/movies/json-import-modal"
import { CategoryExportImportButtons } from "@/components/admin/movies/category-export-import-buttons"
import { ImportCategoryModal } from "@/components/admin/movies/import-category-modal"
import { DraftPublishControls } from "@/components/admin/movies/draft-publish-controls"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2, FileJson } from "lucide-react"
import type { CategoryType } from "@/lib/api/movie-export-import"
import Link from "next/link"
import type {
  Movie,
  CastMember,
  CrewMember,
  StreamingPlatformLink,
  AwardInfo,
  TriviaItem,
  TimelineEvent,
  SceneItem,
} from "@/components/admin/movies/types"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { getAuthHeaders } from "@/lib/auth"

export default function MovieEditPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [hasChanges, setHasChanges] = useState(false)
  const [movieData, setMovieData] = useState<Movie | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Gemini enrichment state
  const [enrichQuery, setEnrichQuery] = useState("")
  const [isEnriching, setIsEnriching] = useState(false)
  // JSON import state
  const [showJSONImport, setShowJSONImport] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<CategoryType | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://iwm-python.onrender.com"

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
  }

  const mapBackendToAdminMovie = (data: any): Movie => {
    const streamingLinks = [] as any[]
    if (data.streamingOptions) {
      for (const region of Object.keys(data.streamingOptions)) {
        for (const item of data.streamingOptions[region] || []) {
          streamingLinks.push({
            id: `${region}-${item.provider}-${Math.random().toString(36).slice(2, 8)}`,
            provider: item.provider,
            region,
            url: item.url,
            type: (item.type || "subscription") as any,
            price: item.price || undefined,
            quality: (item.quality || "HD") as any,
            verified: !!item.verified,
          })
        }
      }
    }

    const cast = (data.cast || []).map((c: any, idx: number) => ({
      id: c.id || `${idx}`,
      name: c.name,
      character: c.character || "",
      image: c.profileUrl || undefined,
      order: idx,
    }))

    const crewRoleMap = [
      ...(data.directors || []).map((p: any) => ({ id: p.id, name: p.name, role: "Director", department: "Directing", image: p.profileUrl })),
      ...(data.writers || []).map((p: any) => ({ id: p.id, name: p.name, role: "Writer", department: "Writing", image: p.profileUrl })),
      ...(data.producers || []).map((p: any) => ({ id: p.id, name: p.name, role: "Producer", department: "Production", image: p.profileUrl })),
    ]

    const languages = data.language ? [data.language] : []

    const awards = (data.awards || []).map((a: any, i: number) => ({
      id: a.id || `${i}`,
      name: a.name,
      year: a.year,
      category: a.category,
      status: a.status || "Nominee",
      // New fields for Indian awards support
      ceremony_id: a.ceremony_id,
      country: a.country,
      language: a.language,
      organization: a.organization,
      prestige_level: a.prestige_level,
    }))

    const m: Movie = {
      id: data.id || "",
      tmdbId: data.tmdb_id || data.tmdbId,
      title: data.title || "",
      originalTitle: data.title || "",
      poster: data.posterUrl || "",
      backdrop: data.backdropUrl || "",
      sidduScore: data.sidduScore || 0,
      releaseDate: data.releaseDate || undefined,
      status: (data.status || "draft") as any,
      genres: data.genres || [],
      synopsis: data.synopsis || "",
      runtime: data.runtime || 0,
      languages: languages,
      certification: (data.rating || "Unrated") as any,
      cast,
      crew: crewRoleMap,
      galleryImages: [],
      trailerUrl: "",
      trailerEmbed: "",
      streamingLinks,
      releaseDates: [],
      awards,
      trivia: (data.trivia || []).map((t: any, i: number) => ({ id: `${i}`, question: t.question, category: t.category, answer: t.answer, explanation: t.explanation })),
      timelineEvents: (data.timeline || []).map((tl: any, i: number) => ({ id: `${i}`, date: tl.date, title: tl.title, description: tl.description, category: tl.type })),
      isPublished: true,
      isArchived: false,
      budget: data.budget || 0,
      boxOffice: data.revenue || 0,
      productionCompanies: [],
      countriesOfOrigin: data.country ? [data.country] : [],
      tagline: data.tagline || "",
      keywords: [],
      aspectRatio: "",
      soundMix: [],
      camera: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importedFrom: "Gemini",
      // Video playback fields
      videoUrl: data.videoUrl || data.video_url || undefined,
      videoSource: data.videoSource || data.video_source || "youtube",
      isFree: data.isFree !== undefined ? data.isFree : (data.is_free !== undefined ? data.is_free : true),
    }
    return m
  }

  const handleEnrichFromGemini = async () => {
    if (!movieData) return
    const q = (enrichQuery || movieData.title || "").trim()
    if (!q) {
      toast({ variant: "destructive", title: "Missing query", description: "Enter a title to fetch from Gemini." })
      return
    }
    try {
      setIsEnriching(true)
      const authHeaders = getAuthHeaders()
      const res = await fetch(`${apiBase}/api/v1/admin/movies/enrich`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ query: q, provider: "gemini" }),
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast({
            variant: "destructive",
            title: "Not authenticated",
            description: "Please log in again.",
          })
          return
        }
        if (res.status === 403) {
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "Admin privileges required.",
          })
          return
        }
        const err = await res.json().catch(() => ({}))
        const detail = err?.detail || err
        toast({
          variant: "destructive",
          title: `Gemini failed (${res.status})`,
          description: typeof detail === "string" ? detail : JSON.stringify(detail),
        })
        return
      }
      const data = await res.json()
      const externalId = data.external_id
      const providerUsed = data.provider_used
      const getRes = await fetch(`${apiBase}/api/v1/movies/${externalId}`)
      if (!getRes.ok) throw new Error(`Failed to fetch movie ${externalId}`)
      const backendMovie = await getRes.json()
      const mapped = mapBackendToAdminMovie(backendMovie)
      setMovieData(mapped)
      setHasChanges(true)
      toast({ title: "Enriched from Gemini", description: `Provider: ${providerUsed}. Review and publish.` })
      setActiveTab("basic")
    } catch (e: any) {
      toast({ variant: "destructive", title: "Enrichment error", description: e?.message || "Unknown error" })
    } finally {
      setIsEnriching(false)
    }
  }

  const handlePublishToBackend = async () => {
    if (!movieData) return
    try {
      setIsSaving(true)

      // Generate external_id
      const extId = movieData.id && !movieData.id.startsWith("mock-") && movieData.id !== "new"
        ? movieData.id
        : `manual-${slugify(movieData.title || "movie")}-${Date.now()}`

      // Get auth headers once at the beginning
      const authHeaders = getAuthHeaders()

      // Check for duplicates by title
      const checkRes = await fetch(`${apiBase}/api/v1/movies?limit=100`, {
        headers: authHeaders,
      })

      if (checkRes.ok) {
        const checkData = await checkRes.json()
        const existingMovie = checkData.movies?.find(
          (m: any) => m.title?.toLowerCase() === movieData.title?.toLowerCase()
        )

        if (existingMovie && existingMovie.id !== extId) {
          const confirmDuplicate = window.confirm(
            `A movie with the title "${movieData.title}" already exists (ID: ${existingMovie.id}).\n\n` +
            `Do you want to continue and create a duplicate entry?`
          )
          if (!confirmDuplicate) {
            setIsSaving(false)
            return
          }
        }
      }

      // Map admin state -> backend MovieImportIn
      const directors = (movieData.crew || []).filter(c => c.role?.toLowerCase() === "director").map(c => ({ name: c.name, image: c.image }))
      const writers = (movieData.crew || []).filter(c => c.role?.toLowerCase() === "writer").map(c => ({ name: c.name, image: c.image }))
      const producers = (movieData.crew || []).filter(c => c.role?.toLowerCase() === "producer").map(c => ({ name: c.name, image: c.image }))
      const cast = (movieData.cast || []).map(c => ({ name: c.name, image: c.image, character: c.character }))

      // Transform trivia data to backend format
      const trivia = (movieData.trivia || []).map((t: any) => ({
        question: t.question,
        category: t.category,
        answer: t.answer,
        explanation: t.explanation || undefined,
      }))

      // Transform timeline data to backend format
      const timeline = (movieData.timelineEvents || []).map((e: any) => ({
        date: e.date,
        title: e.title,
        description: e.description || "",
        type: e.category || e.type || "production",
      }))

      console.log("Saving trivia:", trivia)
      console.log("Saving timeline:", timeline)

      const payload = [{
        external_id: extId,
        title: movieData.title,
        tagline: movieData.tagline || undefined,
        year: movieData.releaseDate ? movieData.releaseDate.slice(0, 4) : undefined,
        release_date: movieData.releaseDate || undefined,
        runtime: movieData.runtime || undefined,
        rating: (movieData.certification as any) || undefined,
        siddu_score: movieData.sidduScore || undefined,
        critics_score: undefined,
        imdb_rating: undefined,
        rotten_tomatoes_score: undefined,
        language: (movieData.languages && movieData.languages[0]) || undefined,
        country: (movieData.countriesOfOrigin && movieData.countriesOfOrigin[0]) || undefined,
        overview: movieData.synopsis || undefined,
        poster_url: movieData.poster || undefined,
        backdrop_url: movieData.backdrop || undefined,
        budget: movieData.budget || undefined,
        revenue: movieData.boxOffice || undefined,
        status: (movieData.status as any) || undefined,
        genres: movieData.genres || [],
        directors,
        writers,
        producers,
        cast,
        streaming: (movieData.streamingLinks || []).map((s, i) => ({
          platform: s.provider,
          region: s.region,
          type: s.type,
          price: s.price,
          quality: s.quality,
          url: s.url,
        })),
        trivia: trivia.length > 0 ? trivia : undefined,
        timeline: timeline.length > 0 ? timeline : undefined,
        video_url: (movieData as any).videoUrl || undefined,
        video_source: (movieData as any).videoSource || undefined,
        is_free: (movieData as any).isFree !== undefined ? (movieData as any).isFree : undefined,
      }]

      const res = await fetch(`${apiBase}/api/v1/admin/movies/import`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Not authenticated. Please log in again.")
        }
        if (res.status === 403) {
          throw new Error("Access denied. Admin privileges required.")
        }
        const json = await res.json().catch(() => ({}))
        throw new Error(json.detail || typeof json === "string" ? json : JSON.stringify(json))
      }

      const json = await res.json()

      // Verify the movie was actually saved by fetching it
      const verifyRes = await fetch(`${apiBase}/api/v1/movies/${extId}`, {
        headers: authHeaders,
      })

      if (!verifyRes.ok) {
        throw new Error(
          `Movie was imported but cannot be fetched. ` +
          `This might be a database issue. ` +
          `Status: ${verifyRes.status}. ` +
          `Try checking the backend logs.`
        )
      }

      const triviaCount = trivia.length
      const timelineCount = timeline.length
      const details = []
      if (triviaCount > 0) details.push(`${triviaCount} trivia items`)
      if (timelineCount > 0) details.push(`${timelineCount} timeline events`)

      toast({
        title: "Published Successfully",
        description: `Imported: ${json.imported}, Updated: ${json.updated}. ${details.length > 0 ? `Saved: ${details.join(", ")}. ` : ""}Redirecting to movie page...`
      })

      // Redirect to public movie page (frontend)
      const idToVisit = extId

      // Small delay to ensure toast is visible
      setTimeout(() => {
        router.push(`/movies/${idToVisit}`)
      }, 1000)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Publish failed", description: e?.message || "Unknown error" })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      if (params.id === "new") {
        setMovieData({
          id: "", // Will be generated on save
          title: "",
          originalTitle: "",
          poster: "",
          backdrop: "",
          sidduScore: 0,
          releaseDate: new Date().toISOString().split("T")[0],
          status: "draft",
          genres: [],
          synopsis: "",
          runtime: 0,
          languages: [],
          certification: "Unrated",
          cast: [],
          crew: [],
          galleryImages: [],
          trailerUrl: "",
          trailerEmbed: "",
          streamingLinks: [],
          releaseDates: [],
          awards: [],
          trivia: [], // New field
          timelineEvents: [], // New field
          isPublished: false,
          isArchived: false,
          budget: 0,
          boxOffice: 0,
          productionCompanies: [],
          countriesOfOrigin: [],
          tagline: "",
          keywords: [],
          aspectRatio: "",
          soundMix: [],
          camera: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importedFrom: "Manual",
        })
        setIsLoading(false)
        document.title = "Add New Movie | Movie Madders Admin"
        return
      }

      try {
        // Fetch from backend API instead of mock data
        const res = await fetch(`${apiBase}/api/v1/movies/${params.id as string}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("Movie not found")
          } else {
            setError(`Failed to fetch movie: ${res.status} ${res.statusText}`)
          }
          setMovieData(null)
        } else {
          const backendMovie = await res.json()
          const mapped = mapBackendToAdminMovie(backendMovie)
          setMovieData({
            ...mapped,
            trivia: mapped.trivia || [],
            timelineEvents: mapped.timelineEvents || [],
          })
          document.title = `Edit Movie: ${mapped.title} | Movie Madders Admin`
        }
      } catch (e: any) {
        setError(e.message || "Failed to fetch movie")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, apiBase])

  const handleSaveChanges = async () => {
    if (!movieData) return
    setIsSaving(true)
    try {
      // For new movies, use "Publish to Backend" instead
      if (params.id === "new") {
        toast({
          variant: "destructive",
          title: "Use 'Publish to Backend'",
          description: "For new movies, click 'Publish to Backend' to save to the database.",
        })
        setIsSaving(false)
        return
      }

      // For existing movies, update via the import endpoint (upsert by external_id)
      const authHeaders = getAuthHeaders()

      // Map admin state -> backend MovieImportIn
      const directors = (movieData.crew || []).filter(c => c.role?.toLowerCase() === "director").map(c => ({ name: c.name, image: c.image }))
      const writers = (movieData.crew || []).filter(c => c.role?.toLowerCase() === "writer").map(c => ({ name: c.name, image: c.image }))
      const producers = (movieData.crew || []).filter(c => c.role?.toLowerCase() === "producer").map(c => ({ name: c.name, image: c.image }))
      const cast = (movieData.cast || []).map(c => ({ name: c.name, image: c.image, character: c.character }))

      const payload = [{
        external_id: movieData.id,
        title: movieData.title,
        tagline: movieData.tagline || undefined,
        year: movieData.releaseDate ? movieData.releaseDate.slice(0, 4) : undefined,
        release_date: movieData.releaseDate || undefined,
        runtime: movieData.runtime || undefined,
        rating: (movieData.certification as any) || undefined,
        siddu_score: movieData.sidduScore || undefined,
        critics_score: undefined,
        imdb_rating: undefined,
        rotten_tomatoes_score: undefined,
        language: (movieData.languages && movieData.languages[0]) || undefined,
        country: (movieData.countriesOfOrigin && movieData.countriesOfOrigin[0]) || undefined,
        overview: movieData.synopsis || undefined,
        poster_url: movieData.poster || undefined,
        backdrop_url: movieData.backdrop || undefined,
        budget: movieData.budget || undefined,
        revenue: movieData.boxOffice || undefined,
        status: (movieData.status as any) || undefined,
        genres: movieData.genres || [],
        directors,
        writers,
        producers,
        cast,
        streaming: (movieData.streamingLinks || []).map((s, i) => ({
          platform: s.provider,
          region: s.region,
          type: s.type,
          price: s.price,
          quality: s.quality,
          url: s.url,
        })),
        video_url: (movieData as any).videoUrl || undefined,
        video_source: (movieData as any).videoSource || undefined,
        is_free: (movieData as any).isFree !== undefined ? (movieData as any).isFree : undefined,
      }]

      const res = await fetch(`${apiBase}/api/v1/admin/movies/import`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Not authenticated. Please log in again.")
        }
        if (res.status === 403) {
          throw new Error("Access denied. Admin privileges required.")
        }
        const json = await res.json().catch(() => ({}))
        throw new Error(json.detail || typeof json === "string" ? json : JSON.stringify(json))
      }

      const json = await res.json()

      toast({
        title: "Movie Updated Successfully!",
        description: `Changes to "${movieData.title}" have been saved.`,
      })
      setHasChanges(false)
    } catch (e: any) {
      setError(e.message || "Failed to save changes")
      toast({
        variant: "destructive",
        title: "Error Saving Movie",
        description: e.message || "An unexpected error occurred.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateMovieField = (fieldName: string, value: any) => {
    setMovieData((prev) => {
      if (!prev) return null
      const updatedMovie = { ...prev, [fieldName]: value }
      if (fieldName === "title" && params.id !== "new") {
        document.title = `Edit Movie: ${value} | Movie Madders Admin`
      }
      return updatedMovie
    })
    setHasChanges(true)
  }

  const onBasicInfoChange = (updates: Partial<Movie>) => {
    setMovieData((prev) => ({ ...prev!, ...updates }))
    setHasChanges(true)
    if (updates.title && params.id !== "new") {
      document.title = `Edit Movie: ${updates.title} | Movie Madders Admin`
    }
  }

  const onMediaInfoChange = (
    updates: Partial<Pick<Movie, "poster" | "backdrop" | "galleryImages" | "trailerUrl" | "trailerEmbed">>,
  ) => {
    setMovieData((prev) => ({ ...prev!, ...updates }))
    setHasChanges(true)
  }

  const onCastCrewChange = (updates: { cast?: CastMember[]; crew?: CrewMember[] }) => {
    setMovieData((prev) => ({ ...prev!, ...updates }))
    setHasChanges(true)
  }

  const onStreamingChange = (updatedLinks: StreamingPlatformLink[]) => {
    setMovieData((prev) => ({ ...prev!, streamingLinks: updatedLinks }))
    setHasChanges(true)
  }

  const handleAwardsChange = (awards: AwardInfo[]) => {
    setMovieData((prev) => ({ ...prev!, awards: awards }))
    setHasChanges(true)
  }

  const handleTriviaChange = (trivia: TriviaItem[]) => {
    console.log("Trivia changed:", trivia)
    setMovieData((prev) => ({ ...prev!, trivia: trivia }))
    setHasChanges(true)
  }

  const handleTimelineEventsChange = (events: TimelineEvent[]) => {
    console.log("Timeline events changed:", events)
    setMovieData((prev) => ({ ...prev!, timelineEvents: events }))
    setHasChanges(true)
  }

  const handleScenesChange = (scenes: SceneItem[]) => {
    setMovieData((prev) => ({ ...prev!, scenes: scenes }))
    setHasChanges(true)
  }

  const handleJSONImport = (importedData: Partial<Movie>) => {
    setMovieData((prev) => ({
      ...prev!,
      ...importedData,
      // Preserve system fields
      id: prev!.id,
      createdAt: prev!.createdAt,
      updatedAt: prev!.updatedAt,
    }))
    setHasChanges(true)
    toast({
      title: "Import successful!",
      description: "Movie data has been imported. Review all tabs and save when ready.",
    })
  }

  const handleOpenImportModal = (category: CategoryType) => {
    setCurrentCategory(category)
    setImportModalOpen(true)
  }

  const handleImportSuccess = async () => {
    // Refresh movie data after successful import
    if (params.id && params.id !== "new") {
      try {
        // Wait a bit for backend to process the import
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Fetch fresh data from backend
        const res = await fetch(`${apiBase}/api/v1/movies/${params.id as string}`)
        if (res.ok) {
          const backendMovie = await res.json()
          const mapped = mapBackendToAdminMovie(backendMovie)
          setMovieData({
            ...mapped,
            trivia: mapped.trivia || [],
            timelineEvents: mapped.timelineEvents || [],
            awards: mapped.awards || [],
          })

          toast({
            title: "Data Refreshed",
            description: "Imported data is now visible in the form",
          })
        } else {
          // Fallback to page reload if fetch fails
          window.location.reload()
        }
      } catch (error) {
        console.error("Failed to refresh movie data:", error)
        // Fallback to page reload on error
        window.location.reload()
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div>
              <Skeleton className="h-8 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <Skeleton className="h-10 w-full max-w-4xl rounded-md" /> {/* TabsList Skeleton */}
        <div className="mt-6 space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" /> {/* TabContent Skeleton */}
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-6">Error: {error}. Please try refreshing the page or contact support.</div>
  }

  if (!movieData && !isLoading && !error) {
    return <div className="p-6">Movie data could not be loaded. It might have been deleted or an error occurred.</div>
  }

  // Fallback for movieData if it's still null after loading and no error
  if (!movieData) {
    return <div className="p-6 text-center">Loading movie data... If this persists, please refresh.</div>
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Link href="/admin/movies" aria-label="Back to movies list">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              {params.id === "new" ? "Add New Movie" : `Edit: ${movieData?.title || "Movie"}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {params.id === "new"
                ? "Fill in the details for the new movie."
                : "Update movie details and manage its content."}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="secondary" className="gap-2" onClick={handlePublishToBackend} disabled={isSaving}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Publish to Backend
          </Button>
          <Button className="gap-2" disabled={!hasChanges || isSaving} onClick={handleSaveChanges}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {params.id === "new" ? "Create Draft (Local)" : "Save Draft (Local)"}
          </Button>
        </div>
      </motion.div>

      {/* Import Options Bar */}
      <div className="w-full -mt-2 space-y-2">
        {/* Gemini Enrichment */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
          <input
            type="text"
            className="col-span-4 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Query to fetch from Gemini (default: current Title)"
            value={enrichQuery || movieData?.title || ""}
            onChange={(e) => setEnrichQuery(e.target.value)}
          />
          <Button
            variant="outline"
            className="col-span-2 gap-2"
            onClick={handleEnrichFromGemini}
            disabled={isEnriching}
          >
            {isEnriching ? <Loader2 size={16} className="animate-spin" /> : null}
            Fetch from Gemini
          </Button>
        </div>

        {/* JSON Import Button - Only show for new movies */}
        {params.id === "new" && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setShowJSONImport(true)}
            >
              <FileJson size={16} />
              Import via JSON
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 w-full max-w-full overflow-x-auto">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="cast-crew">Cast & Crew</TabsTrigger>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
          <TabsTrigger value="trivia">Trivia</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="scenes">Scenes</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          {params.id !== "new" && (
            <CategoryExportImportButtons
              movieId={movieData.id}
              category="basic-info"
              onImportClick={() => handleOpenImportModal("basic-info")}
              showBulkExport={true}
            />
          )}
          <MovieBasicInfoForm
            movie={movieData}
            onFieldChange={updateMovieField}
            onChanges={() => setHasChanges(true)}
          />
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          {params.id !== "new" && (
            <CategoryExportImportButtons
              movieId={movieData.id}
              category="media"
              onImportClick={() => handleOpenImportModal("media")}
            />
          )}
          <MovieMediaForm
            initialValues={{
              poster: movieData.poster,
              backdrop: movieData.backdrop,
              galleryImages: movieData.galleryImages,
              trailerUrl: movieData.trailerUrl,
              trailerEmbed: movieData.trailerEmbed,
            }}
            onChanges={onMediaInfoChange}
          />
        </TabsContent>

        <TabsContent value="cast-crew" className="mt-6">
          {params.id !== "new" && (
            <CategoryExportImportButtons
              movieId={movieData.id}
              category="cast-crew"
              onImportClick={() => handleOpenImportModal("cast-crew")}
            />
          )}
          <MovieCastCrewForm
            initialCast={movieData.cast || []}
            initialCrew={movieData.crew || []}
            onCastChange={(newCast) => updateMovieField("cast", newCast)}
            onCrewChange={(newCrew) => updateMovieField("crew", newCrew)}
            onChanges={() => setHasChanges(true)}
          />
        </TabsContent>

        <TabsContent value="streaming" className="mt-6">
          {params.id !== "new" && (
            <CategoryExportImportButtons
              movieId={movieData.id}
              category="streaming"
              onImportClick={() => handleOpenImportModal("streaming")}
            />
          )}
          <MovieStreamingForm
            initialLinks={movieData.streamingLinks || []}
            onStreamingLinksChange={onStreamingChange}
            onChanges={() => setHasChanges(true)}
          />
        </TabsContent>

        <TabsContent value="awards" className="mt-6">
          {params.id !== "new" && (
            <CategoryExportImportButtons
              movieId={movieData.id}
              category="awards"
              onImportClick={() => handleOpenImportModal("awards")}
            />
          )}
          <MovieAwardsFormEnhanced initialAwards={movieData.awards || []} onAwardsChange={handleAwardsChange} />
        </TabsContent>

        <TabsContent value="trivia" className="mt-6">
          {params.id !== "new" && (
            <div className="space-y-4">
              <CategoryExportImportButtons
                movieId={movieData.id}
                category="trivia"
                onImportClick={() => handleOpenImportModal("trivia")}
              />
              <div className="border-t pt-4">
                <DraftPublishControls
                  movieId={movieData.id}
                  category="trivia"
                  onPublishSuccess={handleImportSuccess}
                />
              </div>
            </div>
          )}
          <MovieTriviaForm
            initialTrivia={movieData.trivia || []}
            onTriviaChange={handleTriviaChange}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          {params.id !== "new" && (
            <div className="space-y-4">
              <CategoryExportImportButtons
                movieId={movieData.id}
                category="timeline"
                onImportClick={() => handleOpenImportModal("timeline")}
              />
              <div className="border-t pt-4">
                <DraftPublishControls
                  movieId={movieData.id}
                  category="timeline"
                  onPublishSuccess={handleImportSuccess}
                />
              </div>
            </div>
          )}
          <MovieTimelineForm
            initialEvents={movieData.timelineEvents || []}
            onEventsChange={handleTimelineEventsChange}
          />
        </TabsContent>

        <TabsContent value="scenes" className="mt-6">
          <MovieScenesForm
            initialScenes={movieData.scenes || []}
            onScenesChange={handleScenesChange}
          />
        </TabsContent>
      </Tabs>

      {/* JSON Import Modal */}
      <JSONImportModal
        open={showJSONImport}
        onOpenChange={setShowJSONImport}
        onImport={handleJSONImport}
      />

      {/* Category Import Modal */}
      {currentCategory && (
        <ImportCategoryModal
          isOpen={importModalOpen}
          onClose={() => {
            setImportModalOpen(false)
            setCurrentCategory(null)
          }}
          movieId={movieData.id}
          category={currentCategory}
          onImportSuccess={handleImportSuccess}
          movieData={{
            title: movieData.title,
            year: movieData.releaseDate ? new Date(movieData.releaseDate).getFullYear() : undefined,
            tmdb_id: movieData.tmdbId,
            id: movieData.id,
          }}
        />
      )}
    </div>
  )
}
