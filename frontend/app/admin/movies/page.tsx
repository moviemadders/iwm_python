"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { MovieManagementTable } from "@/components/admin/movies/movie-management-table"
import { MovieGridView } from "@/components/admin/movies/movie-grid-view"
import { MovieListingHeader } from "@/components/admin/movies/movie-listing-header"
import { MovieFilters } from "@/components/admin/movies/movie-filters"
import { motion } from "framer-motion"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { MovieBatchActionsToolbar } from "@/components/admin/movies/movie-batch-actions-toolbar"
import {
  mockMoviesData, // This will be our initial data source
  getMockMovieById,
  updateMockMovie,
  deleteMockMovie,
  addMockMovie, // Assuming addMockMovie is also exported
} from "@/components/admin/movies/mock-movie-data"
import type {
  Movie,
  MovieStatus,
  MovieGenre,
  StreamingPlatformLink,
  ReleaseDateInfo,
  MovieFiltersState,
} from "@/components/admin/movies/types"
import { useToast } from "@/hooks/use-toast" // Corrected path
import { ManageStreamingLinksModal } from "@/components/admin/movies/modals/manage-streaming-links-modal"
import { UpdateReleaseDateModal } from "@/components/admin/movies/modals/update-release-date-modal"
import { ConfirmationModal } from "@/components/shared/confirmation-modal"
import { ApiImportModal } from "@/components/admin/movies/modals/api-import-modal"
import { JsonImportModal } from "@/components/admin/movies/modals/json-import-modal"
import { JsonExportModal } from "@/components/admin/movies/modals/json-export-modal"
import { Button } from "@/components/ui/button"
import { BulkActionToolbar } from "@/components/admin/movies/bulk-action-toolbar"
import { BulkUpdateModal } from "@/components/admin/movies/bulk-update-modal"
import { toast as sonnerToast } from "sonner"
import {
  bulkUpdateMovies,
  bulkPublishMovies,
  bulkFeatureMovies
} from "@/lib/api/admin-curation"
import type { MovieListItem } from "@/components/admin/movies/bulk-update-modal"

type SortConfig = {
  key: keyof Movie
  direction: "asc" | "desc"
}

export default function MovieManagementPage() {
  const [movies, setMovies] = useState<Movie[]>([]) // Initialize empty, then load
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<MovieFiltersState>({
    genre: "all",
    status: "all",
    year: "all",
  })
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: "releaseDate", direction: "desc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20) // Fetch 20 per page from server
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalMovies, setTotalMovies] = useState(0) // Total count from server
  const { toast } = useToast()
  
  // Debounce search to avoid excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Modals State
  const [isManageLinksModalOpen, setIsManageLinksModalOpen] = useState(false)
  const [isUpdateDateModalOpen, setIsUpdateDateModalOpen] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [isApiImportModalOpen, setIsApiImportModalOpen] = useState(false)
  const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false)
  const [isJsonExportModalOpen, setIsJsonExportModalOpen] = useState(false)
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false)

  const [currentMovieForModal, setCurrentMovieForModal] = useState<Movie | null>(null)
  const [confirmationAction, setConfirmationAction] = useState<{
    action: () => Promise<void>
    title: string
    description: string
    confirmText?: string
    variant?: "destructive" | "warning" | "primary"
  } | null>(null)

  useEffect(() => {
    // Fetch movies from backend API with server-side pagination, search, and filters
    const fetchMovies = async () => {
      setIsLoading(true)
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://iwm-python.onrender.com"
        
        // Build query parameters for server-side filtering
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
        })
        
        // Add search query if present
        if (debouncedSearch) {
          // Use the search endpoint for text queries
          const searchRes = await fetch(`${apiBase}/api/v1/movies/search?q=${encodeURIComponent(debouncedSearch)}&limit=${pageSize}`)
          if (!searchRes.ok) throw new Error("Failed to search movies")
          const searchData = await searchRes.json()
          const results = searchData.results || []
          
          // Map results
          const mappedMovies = results.map((m: any) => ({
            id: m.id,
            title: m.title,
            originalTitle: m.title,
            poster: m.posterUrl || "/abstract-movie-poster.png",
            backdrop: m.backdropUrl || "/movie-backdrop.png",
            sidduScore: m.sidduScore || 0,
            releaseDate: m.releaseDate ? m.releaseDate.split("T")[0] : new Date().toISOString().split("T")[0],
            status: (m.status || "draft").toLowerCase() as MovieStatus,
            genres: m.genres || [],
            synopsis: m.synopsis || m.overview || "",
            runtime: m.runtime || 120,
            languages: [m.language || "English"],
            certification: m.rating || "Unrated",
            cast: m.cast || [],
            crew: m.directors || [],
            galleryImages: [],
            trailerUrl: "",
            trailerEmbed: "",
            streamingLinks: [],
            releaseDates: [{ region: "US", date: m.releaseDate ? m.releaseDate.split("T")[0] : "", type: "Theatrical" }],
            awards: [],
            isPublished: m.status === "released",
            isArchived: false,
            importedFrom: "backend",
            budget: m.budget,
            boxOffice: m.revenue,
            productionCompanies: [],
            countriesOfOrigin: [m.country || ""],
            tagline: m.tagline || "",
            keywords: [],
            aspectRatio: "",
            soundMix: [],
            camera: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
          
          setMovies(mappedMovies)
          setTotalMovies(searchData.total || results.length)
          setIsLoading(false)
          return
        }
        
        // Add filters
        if (filters.genre && filters.genre !== "all") {
          params.set("genre", filters.genre)
        }
        if (filters.status && filters.status !== "all") {
          params.set("status", filters.status)
        }
        if (filters.year && filters.year !== "all") {
          const year = parseInt(filters.year as string)
          params.set("yearMin", year.toString())
          params.set("yearMax", year.toString())
        }
        
        // Add sorting
        if (sortConfig) {
          const sortField = sortConfig.key === "releaseDate" ? "year" : sortConfig.key
          params.set("sortBy", `${sortField}:${sortConfig.direction}`)
        }
        
        const res = await fetch(`${apiBase}/api/v1/movies?${params.toString()}`)
        if (!res.ok) throw new Error("Failed to fetch movies")
        const data = await res.json()

        // Map backend movies to frontend Movie type
        const mappedMovies = data.map((m: any) => ({
          id: m.id,
          title: m.title,
          originalTitle: m.title,
          poster: m.posterUrl || "/abstract-movie-poster.png",
          backdrop: m.backdropUrl || "/movie-backdrop.png",
          sidduScore: m.sidduScore || 0,
          releaseDate: m.releaseDate ? m.releaseDate.split("T")[0] : new Date().toISOString().split("T")[0],
          status: (m.status || "draft").toLowerCase() as MovieStatus,
          genres: m.genres || [],
          synopsis: m.synopsis || m.overview || "",
          runtime: m.runtime || 120,
          languages: [m.language || "English"],
          certification: m.rating || "Unrated",
          cast: m.cast || [],
          crew: m.directors || [],
          galleryImages: [],
          trailerUrl: "",
          trailerEmbed: "",
          streamingLinks: m.streamingOptions ? Object.entries(m.streamingOptions).flatMap(([region, options]: any) =>
            (Array.isArray(options) ? options : [options]).map((opt: any) => ({
              platform: opt.provider,
              region,
              type: opt.type,
              url: opt.url,
            }))
          ) : [],
          releaseDates: [{ region: "US", date: m.releaseDate ? m.releaseDate.split("T")[0] : "", type: "Theatrical" }],
          awards: [],
          isPublished: m.status === "released",
          isArchived: false,
          importedFrom: "backend",
          budget: m.budget,
          boxOffice: m.revenue,
          productionCompanies: [],
          countriesOfOrigin: [m.country || ""],
          tagline: m.tagline || "",
          keywords: [],
          aspectRatio: "",
          soundMix: [],
          camera: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))

        setMovies(mappedMovies)
        // For now, estimate total - ideally backend should return total count
        setTotalMovies(mappedMovies.length < pageSize ? (currentPage - 1) * pageSize + mappedMovies.length : currentPage * pageSize + 1)
      } catch (error) {
        console.error("Error fetching movies:", error)
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch movies from backend" })
        setMovies([])
        setTotalMovies(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovies()
  }, [currentPage, pageSize, debouncedSearch, filters, sortConfig])

  const handleSelectMovie = useCallback((movieId: string, checked: boolean) => {
    setSelectedMovieIds((prevSelected) =>
      checked ? [...prevSelected, movieId] : prevSelected.filter((id) => id !== movieId),
    )
  }, [])

  // Server-side filtering/sorting - movies are already filtered
  // Just use them directly
  const paginatedMovies = movies
  const totalPages = Math.ceil(totalMovies / pageSize)

  const handleSort = useCallback((key: keyof Movie) => {
    setSortConfig((prevConfig) => {
      const direction = prevConfig?.key === key && prevConfig.direction === "asc" ? "desc" : "asc"
      return { key, direction }
    })
    setCurrentPage(1)
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedMovieIds(paginatedMovies.map((movie) => movie.id))
      } else {
        setSelectedMovieIds([])
      }
    },
    [paginatedMovies],
  )

  const clearSelection = () => setSelectedMovieIds([])

  const openManageStreamingLinksModal = async (movieId: string) => {
    const movie = await getMockMovieById(movieId)
    if (movie) {
      setCurrentMovieForModal(movie)
      setIsManageLinksModalOpen(true)
    }
  }

  const openUpdateReleaseDateModal = async (movieId: string) => {
    const movie = await getMockMovieById(movieId)
    if (movie) {
      setCurrentMovieForModal(movie)
      setIsUpdateDateModalOpen(true)
    }
  }

  const openApiImportModal = () => {
    setIsApiImportModalOpen(true)
  }

  const openJsonImportModal = () => {
    setIsJsonImportModalOpen(true)
  }

  const openJsonExportModal = () => {
    setIsJsonExportModalOpen(true)
  }

  const handleJsonImportComplete = async (importedMovies: any[]) => {
    setIsLoading(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      const res = await fetch(`${apiBase}/api/v1/admin/movies/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importedMovies),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err))
      }

      const result = await res.json()
      toast({ title: "Import Successful", description: `Imported: ${result.imported}, Updated: ${result.updated}` })

      // Refresh movies list
      const moviesRes = await fetch(`${apiBase}/api/v1/movies`)
      if (moviesRes.ok) {
        const data = await moviesRes.json()
        const mappedMovies = data.map((m: any) => ({
          id: m.id,
          title: m.title,
          originalTitle: m.title,
          poster: m.posterUrl || "/abstract-movie-poster.png",
          backdrop: m.backdropUrl || "/movie-backdrop.png",
          sidduScore: m.sidduScore || 0,
          releaseDate: m.releaseDate ? m.releaseDate.split("T")[0] : new Date().toISOString().split("T")[0],
          status: (m.status || "draft").toLowerCase() as MovieStatus,
          genres: m.genres || [],
          synopsis: m.synopsis || m.overview || "",
          runtime: m.runtime || 120,
          languages: [m.language || "English"],
          certification: m.rating || "Unrated",
          cast: m.cast || [],
          crew: m.directors || [],
          galleryImages: [],
          trailerUrl: "",
          trailerEmbed: "",
          streamingLinks: m.streamingOptions ? Object.entries(m.streamingOptions).flatMap(([region, options]: any) =>
            (Array.isArray(options) ? options : [options]).map((opt: any) => ({
              platform: opt.provider,
              region,
              type: opt.type,
              url: opt.url,
            }))
          ) : [],
          releaseDates: [{ region: "US", date: m.releaseDate ? m.releaseDate.split("T")[0] : "", type: "Theatrical" }],
          awards: [],
          isPublished: m.status === "released",
          isArchived: false,
          importedFrom: "backend",
          budget: m.budget,
          boxOffice: m.revenue,
          productionCompanies: [],
          countriesOfOrigin: [m.country || ""],
          tagline: m.tagline || "",
          keywords: [],
          aspectRatio: "",
          soundMix: [],
          camera: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        setMovies(mappedMovies)
      }

      setIsJsonImportModalOpen(false)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import Failed", description: error.message || "Unknown error" })
    } finally {
      setIsLoading(false)
    }
  }



  const openConfirmationModal = (
    title: string,
    description: string,
    action: () => Promise<void>,
    confirmText?: string,
    variant?: "destructive" | "warning" | "primary",
  ) => {
    setConfirmationAction({ action, title, description, confirmText, variant })
    setIsConfirmationModalOpen(true)
  }

  const updateMovieStates = (ids: string[], updates: Partial<Movie>): Movie[] => {
    return movies.map((movie) =>
      ids.includes(movie.id) ? { ...movie, ...updates, updatedAt: new Date().toISOString() } : movie,
    )
  }

  const handlePublishSelected = () => {
    openConfirmationModal(
      "Publish Movies?",
      `Are you sure you want to publish ${selectedMovieIds.length} selected movie(s)? Their status will be set to 'Released'.`,
      async () => {
        setIsLoading(true)
        const updatedMovies = updateMovieStates(selectedMovieIds, { status: "released", isPublished: true })
        for (const id of selectedMovieIds) {
          const movieToUpdate = updatedMovies.find((m) => m.id === id)
          if (movieToUpdate) await updateMockMovie(movieToUpdate)
        }
        setMovies(updatedMovies)
        toast({ title: `${selectedMovieIds.length} Movie(s) Published`, description: "Status set to 'Released'." })
        clearSelection()
        setIsLoading(false)
      },
      "Publish Selected",
      "primary",
    )
  }

  const handleUnpublishSelected = () => {
    openConfirmationModal(
      "Unpublish Movies?",
      `Are you sure you want to unpublish ${selectedMovieIds.length} selected movie(s)? Their status will be set to 'Draft'.`,
      async () => {
        setIsLoading(true)
        const updatedMovies = updateMovieStates(selectedMovieIds, { status: "draft", isPublished: false })
        for (const id of selectedMovieIds) {
          const movieToUpdate = updatedMovies.find((m) => m.id === id)
          if (movieToUpdate) await updateMockMovie(movieToUpdate)
        }
        setMovies(updatedMovies)
        toast({ title: `${selectedMovieIds.length} Movie(s) Unpublished`, description: "Status set to 'Draft'." })
        clearSelection()
        setIsLoading(false)
      },
      "Unpublish Selected",
      "warning",
    )
  }

  const handleArchiveSelected = () => {
    openConfirmationModal(
      "Archive Movies?",
      `Are you sure you want to archive ${selectedMovieIds.length} selected movie(s)? Their status will be set to 'Archived'.`,
      async () => {
        setIsLoading(true)
        const updatedMovies = updateMovieStates(selectedMovieIds, {
          status: "archived",
          isArchived: true,
          isPublished: false,
        })
        for (const id of selectedMovieIds) {
          const movieToUpdate = updatedMovies.find((m) => m.id === id)
          if (movieToUpdate) await updateMockMovie(movieToUpdate)
        }
        setMovies(updatedMovies)
        toast({ title: `${selectedMovieIds.length} Movie(s) Archived`, description: "Status set to 'Archived'." })
        clearSelection()
        setIsLoading(false)
      },
      "Archive Selected",
      "warning",
    )
  }

  const handleDeleteSelected = () => {
    openConfirmationModal(
      "Delete Selected Movies?",
      `Are you sure you want to permanently delete ${selectedMovieIds.length} selected movie(s)? This action cannot be undone.`,
      async () => {
        setIsLoading(true)
        for (const id of selectedMovieIds) {
          await deleteMockMovie(id)
        }
        setMovies((prev) => prev.filter((movie) => !selectedMovieIds.includes(movie.id)))
        toast({ title: `${selectedMovieIds.length} Movie(s) Deleted`, variant: "destructive" })
        clearSelection()
        setCurrentPage(1)
        setIsLoading(false)
      },
      "Delete Selected Permanently",
      "destructive",
    )
  }

  const handleDeleteSingleMovie = (movieId: string) => {
    const movieToDelete = movies.find((m) => m.id === movieId)
    openConfirmationModal(
      `Delete "${movieToDelete?.title || "Movie"}"?`,
      `Are you sure you want to permanently delete this movie? This action cannot be undone.`,
      async () => {
        setIsLoading(true)
        await deleteMockMovie(movieId)
        setMovies((prev) => prev.filter((m) => m.id !== movieId))
        toast({ title: `"${movieToDelete?.title || "Movie"}" Deleted`, variant: "destructive" })
        if (paginatedMovies.length === 1 && currentPage > 1 && totalPages > 1) {
          setCurrentPage(currentPage - 1)
        } else if (paginatedMovies.length === 1 && totalPages <= 1) {
          setCurrentPage(1)
        }
        setIsLoading(false)
      },
      "Delete Permanently",
      "destructive",
    )
  }

  const handleSaveStreamingLinks = async (movieId: string, updatedLinks: StreamingPlatformLink[]) => {
    setIsLoading(true)
    const movieToUpdate = await getMockMovieById(movieId)
    if (movieToUpdate) {
      const updatedMovieData = { ...movieToUpdate, streamingLinks: updatedLinks, updatedAt: new Date().toISOString() }
      await updateMockMovie(updatedMovieData)
      setMovies((prev) => prev.map((m) => (m.id === movieId ? updatedMovieData : m)))
      toast({ title: "Streaming Links Updated", description: `Links for "${updatedMovieData.title}" saved.` })
    }
    setIsLoading(false)
    setIsManageLinksModalOpen(false)
  }

  const handleSaveReleaseDates = async (movieId: string, updatedDates: ReleaseDateInfo[]) => {
    setIsLoading(true)
    const movieToUpdate = await getMockMovieById(movieId)
    if (movieToUpdate) {
      const updatedMovieData = { ...movieToUpdate, releaseDates: updatedDates, updatedAt: new Date().toISOString() }
      await updateMockMovie(updatedMovieData)
      setMovies((prev) => prev.map((m) => (m.id === movieId ? updatedMovieData : m)))
      toast({ title: "Release Dates Updated", description: `Dates for "${updatedMovieData.title}" saved.` })
    }
    setIsLoading(false)
    setIsUpdateDateModalOpen(false)
  }

  const handleApiImportComplete = async (importedApiMovies: any[]) => {
    setIsLoading(true)
    const newMoviesFromImport = await Promise.all(
      importedApiMovies.map(async (imported) => {
        const newMovieData: Omit<Movie, "id" | "createdAt" | "updatedAt"> = {
          // Omit fields that addMockMovie will generate
          title: imported.title,
          originalTitle: imported.title,
          poster: imported.posterUrl || "/abstract-movie-poster.png",
          backdrop: "/movie-backdrop.png",
          sidduScore: 0,
          releaseDate: imported.year ? `${imported.year}-01-01` : new Date().toISOString().split("T")[0],
          status: "draft" as MovieStatus,
          genres: [] as MovieGenre[],
          synopsis: "Imported from " + imported.source,
          runtime: 120,
          languages: ["English"],
          certification: "Unrated",
          cast: [],
          crew: [],
          galleryImages: [],
          trailerUrl: "",
          trailerEmbed: "",
          streamingLinks: [],
          releaseDates: [
            {
              region: "US",
              date: imported.year ? `${imported.year}-01-01` : new Date().toISOString().split("T")[0],
              type: "Theatrical",
            },
          ],
          awards: [],
          isPublished: false,
          isArchived: false,
          importedFrom: imported.source,
          // Optional fields with defaults
          budget: undefined,
          boxOffice: undefined,
          productionCompanies: [],
          countriesOfOrigin: [],
          tagline: "",
          keywords: [],
          aspectRatio: "",
          soundMix: [],
          camera: "",
        }
        return addMockMovie(newMovieData) // addMockMovie should return the full Movie object with ID
      }),
    )

    setMovies((prev) => [...prev, ...newMoviesFromImport])
    toast({ title: `${newMoviesFromImport.length} movies imported and added as drafts.` })
    setIsApiImportModalOpen(false)
    setIsLoading(false)
  }

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, filters, totalPages, currentPage]) // Added totalPages to dependency array

  // ============================================================================
  // Bulk Operations Handlers (Phase 5)
  // ============================================================================

  const refreshMovieList = async () => {
    setIsLoading(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      const res = await fetch(`${apiBase}/api/v1/movies`)
      if (!res.ok) throw new Error("Failed to fetch movies")
      const data = await res.json()

      const mappedMovies = data.map((m: any) => ({
        id: m.id,
        title: m.title,
        originalTitle: m.title,
        poster: m.posterUrl || "/abstract-movie-poster.png",
        backdrop: m.backdropUrl || "/movie-backdrop.png",
        sidduScore: m.sidduScore || 0,
        releaseDate: m.releaseDate ? m.releaseDate.split("T")[0] : new Date().toISOString().split("T")[0],
        status: (m.status || "draft").toLowerCase() as MovieStatus,
        genres: m.genres || [],
        synopsis: m.synopsis || m.overview || "",
        runtime: m.runtime || 120,
        languages: [m.language || "English"],
        certification: m.rating || "Unrated",
        cast: m.cast || [],
        crew: m.directors || [],
        galleryImages: [],
        trailerUrl: "",
        trailerEmbed: "",
        streamingLinks: m.streamingOptions ? Object.entries(m.streamingOptions).flatMap(([region, options]: any) =>
          (Array.isArray(options) ? options : [options]).map((opt: any) => ({
            platform: opt.provider,
            region,
            type: opt.type,
            url: opt.url,
          }))
        ) : [],
        releaseDates: [{ region: "US", date: m.releaseDate ? m.releaseDate.split("T")[0] : "", type: "Theatrical" }],
        awards: [],
        isPublished: m.status === "released",
        isArchived: false,
        importedFrom: "backend",
        budget: m.budget,
        boxOffice: m.revenue,
        productionCompanies: [],
        countriesOfOrigin: [m.country || ""],
        tagline: m.tagline || "",
        keywords: [],
        aspectRatio: "",
        soundMix: [],
        camera: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      setMovies(mappedMovies)
    } catch (error) {
      console.error("Error refreshing movies:", error)
      sonnerToast.error("Failed to refresh movie list")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkUpdate = () => {
    setIsBulkUpdateModalOpen(true)
  }

  const handleBulkPublish = async () => {
    if (selectedMovieIds.length === 0) return

    try {
      const numericIds = selectedMovieIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id))

      const response = await bulkPublishMovies({
        movie_ids: numericIds,
        publish: true,
      })

      if (response.success_count > 0) {
        sonnerToast.success(response.message, {
          description: response.failure_count > 0
            ? `${response.failure_count} movie(s) failed to publish`
            : undefined,
        })
      }

      if (response.failure_count > 0 && response.success_count === 0) {
        sonnerToast.error("Failed to publish movies", {
          description: `${response.failure_count} movie(s) could not be published`,
        })
      }

      await refreshMovieList()
      clearSelection()
    } catch (error) {
      sonnerToast.error("Failed to publish movies", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const handleBulkUnpublish = async () => {
    if (selectedMovieIds.length === 0) return

    try {
      const numericIds = selectedMovieIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id))

      const response = await bulkPublishMovies({
        movie_ids: numericIds,
        publish: false,
      })

      if (response.success_count > 0) {
        sonnerToast.success(response.message, {
          description: response.failure_count > 0
            ? `${response.failure_count} movie(s) failed to unpublish`
            : undefined,
        })
      }

      if (response.failure_count > 0 && response.success_count === 0) {
        sonnerToast.error("Failed to unpublish movies", {
          description: `${response.failure_count} movie(s) could not be unpublished`,
        })
      }

      await refreshMovieList()
      clearSelection()
    } catch (error) {
      sonnerToast.error("Failed to unpublish movies", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const handleBulkFeature = async () => {
    if (selectedMovieIds.length === 0) return

    try {
      const numericIds = selectedMovieIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id))

      const response = await bulkFeatureMovies({
        movie_ids: numericIds,
        featured: true,
      })

      if (response.success_count > 0) {
        sonnerToast.success(response.message, {
          description: response.failure_count > 0
            ? `${response.failure_count} movie(s) failed to feature`
            : undefined,
        })
      }

      if (response.failure_count > 0 && response.success_count === 0) {
        sonnerToast.error("Failed to feature movies", {
          description: `${response.failure_count} movie(s) could not be featured`,
        })
      }

      await refreshMovieList()
      clearSelection()
    } catch (error) {
      sonnerToast.error("Failed to feature movies", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const handleBulkUnfeature = async () => {
    if (selectedMovieIds.length === 0) return

    try {
      const numericIds = selectedMovieIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id))

      const response = await bulkFeatureMovies({
        movie_ids: numericIds,
        featured: false,
      })

      if (response.success_count > 0) {
        sonnerToast.success(response.message, {
          description: response.failure_count > 0
            ? `${response.failure_count} movie(s) failed to unfeature`
            : undefined,
        })
      }

      if (response.failure_count > 0 && response.success_count === 0) {
        sonnerToast.error("Failed to unfeature movies", {
          description: `${response.failure_count} movie(s) could not be unfeatured`,
        })
      }

      await refreshMovieList()
      clearSelection()
    } catch (error) {
      sonnerToast.error("Failed to unfeature movies", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const handleBulkUpdateSuccess = async () => {
    await refreshMovieList()
    clearSelection()
  }

  // Convert selected movies to MovieListItem format for bulk update modal
  const selectedMoviesForModal: MovieListItem[] = movies
    .filter(m => selectedMovieIds.includes(m.id))
    .map(m => ({
      id: parseInt(m.id, 10),
      title: m.title,
      year: m.releaseDate ? parseInt(m.releaseDate.split("-")[0], 10) : null,
      curation_status: m.status,
      quality_score: m.sidduScore || null,
      is_featured: false, // This would need to come from backend
    }))

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-bold">Movie Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage your movie database, import content, and configure streaming availability.
        </p>
      </motion.div>

      {/* Phase 5: New Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedMovieIds.length}
        onBulkUpdate={handleBulkUpdate}
        onBulkPublish={handleBulkPublish}
        onBulkUnpublish={handleBulkUnpublish}
        onBulkFeature={handleBulkFeature}
        onBulkUnfeature={handleBulkUnfeature}
        onClearSelection={clearSelection}
      />

      <MovieListingHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onOpenApiImportModal={openApiImportModal}
        onOpenJsonImportModal={openJsonImportModal} // Add this
        onOpenJsonExportModal={openJsonExportModal} // Add this
      />

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MovieFilters filters={filters} onFiltersChange={setFilters} />
        </motion.div>
      )}

      {viewMode === "table" ? (
        <MovieManagementTable
          movies={paginatedMovies}
          searchQuery={searchQuery}
          filters={filters}
          onSort={handleSort}
          sortConfig={sortConfig}
          selectedMovies={selectedMovieIds}
          onSelectMovie={handleSelectMovie}
          onSelectAll={handleSelectAll}
          isLoading={isLoading}
          onOpenManageStreamingLinksModal={openManageStreamingLinksModal}
          onOpenUpdateReleaseDateModal={openUpdateReleaseDateModal}
          onDeleteMovie={handleDeleteSingleMovie}
        />
      ) : (
        <MovieGridView
          movies={paginatedMovies}
          searchQuery={searchQuery}
          filters={filters}
          selectedMovies={selectedMovieIds}
          onSelectMovie={handleSelectMovie}
          isLoading={isLoading}
          onOpenManageStreamingLinksModal={openManageStreamingLinksModal}
          onOpenUpdateReleaseDateModal={openUpdateReleaseDateModal}
          onDeleteMovie={handleDeleteSingleMovie}
        />
      )}

      {totalPages > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={pageSize}
          totalItems={totalMovies}
        />
      )}

      {currentMovieForModal && (
        <>
          <ManageStreamingLinksModal
            isOpen={isManageLinksModalOpen}
            onClose={() => setIsManageLinksModalOpen(false)}
            movieId={currentMovieForModal.id}
            initialLinks={currentMovieForModal.streamingLinks || []}
            onSave={handleSaveStreamingLinks}
          />
          <UpdateReleaseDateModal
            isOpen={isUpdateDateModalOpen}
            onClose={() => setIsUpdateDateModalOpen(false)}
            movieId={currentMovieForModal.id}
            initialDates={currentMovieForModal.releaseDates || []}
            onSave={handleSaveReleaseDates}
          />
        </>
      )}
      {confirmationAction && (
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          onConfirm={async () => {
            if (confirmationAction) {
              // Check if not null
              await confirmationAction.action()
            }
            setIsConfirmationModalOpen(false)
          }}
          title={confirmationAction.title}
          description={confirmationAction.description}
          confirmText={confirmationAction.confirmText}
          variant={confirmationAction.variant}
        />
      )}
      <ApiImportModal
        isOpen={isApiImportModalOpen}
        onClose={() => setIsApiImportModalOpen(false)}
        onImportComplete={handleApiImportComplete}
      />
      <JsonImportModal
        isOpen={isJsonImportModalOpen}
        onClose={() => setIsJsonImportModalOpen(false)}
        onImportComplete={handleJsonImportComplete}
      />

      <JsonExportModal
        isOpen={isJsonExportModalOpen}
        onClose={() => setIsJsonExportModalOpen(false)}
        movieCount={movies.length}
      />

      {/* Phase 5: Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={isBulkUpdateModalOpen}
        onClose={() => setIsBulkUpdateModalOpen(false)}
        selectedMovieIds={selectedMovieIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id))}
        selectedMovies={selectedMoviesForModal}
        onSuccess={handleBulkUpdateSuccess}
      />
    </div>
  )
}
