"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, Grid3X3, List, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MovieGrid } from "@/components/movies/movie-grid"
import { MovieList } from "@/components/movies/movie-list"
import { FilterSidebar } from "@/components/movies/filter-sidebar"
import { ActiveFilters } from "@/components/movies/active-filters"
import { EmptyState } from "@/components/movies/empty-state"
import { LoadingState } from "@/components/movies/loading-state"
import { useDebounce } from "@/hooks/use-debounce"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/api-config"
import { getMovies } from "@/lib/api/movies"

// Backend integration

type ViewMode = "grid" | "list"
type SortOption = "latest" | "score" | "popular" | "alphabetical" | "alphabetical-desc"

export default function MoviesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useMobile()

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortOption>("latest")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [baseMovies, setBaseMovies] = useState<any[]>([])
  const [filters, setFilters] = useState({
    genres: [] as string[],
    yearRange: [1900, new Date().getFullYear()] as [number, number],
    countries: [] as string[],
    languages: [] as string[],
    scoreRange: [0, 10] as [number, number],
    status: [] as string[],
  })

  // Track if we're initializing from URL to prevent update loops
  const [isInitialized, setIsInitialized] = useState(false)

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Initialize from URL params - only run once
  useEffect(() => {
    if (isInitialized) return

    const view = searchParams.get("view") as ViewMode
    if (view) setViewMode(view)

    const sort = searchParams.get("sort") as SortOption
    if (sort) setSortBy(sort)

    const search = searchParams.get("search")
    if (search) setSearchQuery(search)

    // Parse filters from URL
    const genres = searchParams.get("genres")?.split(",").filter(Boolean) || []
    const countries = searchParams.get("countries")?.split(",").filter(Boolean) || []
    const languages = searchParams.get("languages")?.split(",").filter(Boolean) || []
    const status = searchParams.get("status")?.split(",").filter(Boolean) || []

    // Only update filters if there are actual changes
    const yearRangeStart = searchParams.get("yearStart")
    const yearRangeEnd = searchParams.get("yearEnd")
    const scoreRangeStart = searchParams.get("scoreStart")
    const scoreRangeEnd = searchParams.get("scoreEnd")

    const newFilters = {
      ...filters,
      genres,
      countries,
      languages,
      status,
    }

    if (yearRangeStart && yearRangeEnd) {
      newFilters.yearRange = [Number.parseInt(yearRangeStart), Number.parseInt(yearRangeEnd)]
    }

    if (scoreRangeStart && scoreRangeEnd) {
      newFilters.scoreRange = [Number.parseFloat(scoreRangeStart), Number.parseFloat(scoreRangeEnd)]
    }

    setFilters(newFilters)
    setIsInitialized(true)
  }, [searchParams, isInitialized])
  // Fetch movies from backend when filters/sort change
  useEffect(() => {
    const apiBase = getApiUrl() || 'http://localhost:8000'
    console.log('🔗 API Base URL:', apiBase)
    setIsLoading(true)

    const fetchMoviesData = async () => {
      try {
        // If there's a search query, use the search endpoint
        if (debouncedSearchQuery) {
          const searchRes = await fetch(`${apiBase}/api/v1/movies/search?q=${encodeURIComponent(debouncedSearchQuery)}&limit=100`)
          if (!searchRes.ok) throw new Error('Failed to search movies')
          const searchData = await searchRes.json()
          setBaseMovies(Array.isArray(searchData.results) ? searchData.results : [])
          setIsLoading(false)
          return
        }

        // Otherwise, use the regular list endpoint with filters
        const params: any = {
          page: 1,
          limit: 100  // Increased from 50 to show more results
        }

        if (filters.genres.length) params.genre = filters.genres[0]
        if (filters.yearRange[0] > 1900) params.yearMin = filters.yearRange[0]
        if (filters.yearRange[1] < new Date().getFullYear()) params.yearMax = filters.yearRange[1]
        if (sortBy) params.sortBy = sortBy

        const data = await getMovies(params)
        console.log('🎬 Fetched movies from backend:', data?.length || 0, 'movies')
        setBaseMovies(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch movies:', error)
        setBaseMovies([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMoviesData()
  }, [filters, sortBy, debouncedSearchQuery])


  // Update URL when filters change - only after initialization
  const updateURL = (newFilters: typeof filters, newSort: SortOption, newView: ViewMode, newSearch: string) => {
    if (!isInitialized) return

    const params = new URLSearchParams()

    if (newView !== "grid") params.set("view", newView)
    if (newSort !== "latest") params.set("sort", newSort)
    if (newSearch) params.set("search", newSearch)

    if (newFilters.genres.length) params.set("genres", newFilters.genres.join(","))
    if (newFilters.countries.length) params.set("countries", newFilters.countries.join(","))
    if (newFilters.languages.length) params.set("languages", newFilters.languages.join(","))
    if (newFilters.status.length) params.set("status", newFilters.status.join(","))

    // Add year and score ranges as separate params
    if (newFilters.yearRange[0] !== 1900) params.set("yearStart", newFilters.yearRange[0].toString())
    if (newFilters.yearRange[1] !== new Date().getFullYear()) params.set("yearEnd", newFilters.yearRange[1].toString())

    if (newFilters.scoreRange[0] !== 0) params.set("scoreStart", newFilters.scoreRange[0].toString())
    if (newFilters.scoreRange[1] !== 10) params.set("scoreEnd", newFilters.scoreRange[1].toString())

    const queryString = params.toString()
    const newUrl = `/movies${queryString ? `?${queryString}` : ""}`

    // Only update if the URL actually changes
    if (window.location.pathname + window.location.search !== newUrl) {
      router.push(newUrl, { scroll: false })
    }
  }

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let filtered = [...baseMovies]
    console.log('📊 Base movies before client filters:', filtered.length)

    // Search is now handled server-side
    // Genre, country, language, status filters are handled server-side
    // Only apply score and year filters client-side

    // Apply score filter (backend doesn't support this yet)
    filtered = filtered.filter(
      (movie) => (movie.sidduScore || 0) >= filters.scoreRange[0] && (movie.sidduScore || 0) <= filters.scoreRange[1],
    )

    // Apply year filter (backend doesn't support this yet)
    const startYear = filters.yearRange[0]
    const endYear = filters.yearRange[1]

    filtered = filtered.filter((movie) => {
      if (!movie.releaseDate) return true
      const year = new Date(movie.releaseDate).getFullYear()
      return year >= startYear && year <= endYear
    })

    console.log('📊 Movies after client filters:', filtered.length)
    console.log('📊 Score range:', filters.scoreRange, 'Year range:', filters.yearRange)

    // Sort
    switch (sortBy) {
      case "score":
        filtered.sort((a, b) => (b.sidduScore || 0) - (a.sidduScore || 0))
        break
      case "popular":
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        break
      case "alphabetical":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "alphabetical-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title))
        break
      case "latest":
      default:
        filtered.sort((a, b) => {
          const yearA = a.year ? Number.parseInt(a.year) : 0
          const yearB = b.year ? Number.parseInt(b.year) : 0
          return yearB - yearA
        })
    }

    return filtered
  }, [baseMovies, filters, sortBy])

  // Debug: Log final render count
  useEffect(() => {
    console.log('🎯 Rendering movies count:', filteredMovies.length)
  }, [filteredMovies])

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (isInitialized) {
      updateURL(filters, sortBy, mode, searchQuery)
    }
  }

  // Handle sort change
  const handleSortChange = (value: SortOption) => {
    setSortBy(value)
    if (isInitialized) {
      updateURL(filters, value, viewMode, searchQuery)
    }
  }

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (isInitialized) {
      updateURL(filters, sortBy, viewMode, value)
    }
  }

  // Handle filter change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    if (isInitialized) {
      updateURL(newFilters, sortBy, viewMode, searchQuery)
    }
  }

  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.countries.length > 0 ||
    filters.languages.length > 0 ||
    filters.status.length > 0 ||
    filters.scoreRange[0] > 0 ||
    filters.scoreRange[1] < 10 ||
    filters.yearRange[0] > 1900 ||
    filters.yearRange[1] < new Date().getFullYear()

  const clearAllFilters = () => {
    const newFilters = {
      genres: [],
      countries: [],
      languages: [],
      status: [],
      scoreRange: [0, 10] as [number, number],
      yearRange: [1900, new Date().getFullYear()] as [number, number],
    }
    setFilters(newFilters)
    if (isInitialized) {
      updateURL(newFilters, sortBy, viewMode, searchQuery)
    }
  }

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <motion.div className="min-h-screen bg-[#1A1A1A]" initial="hidden" animate="visible" variants={pageVariants}>
      {/* Page Header */}
      <motion.div
        className="border-b border-[#3A3A3A] bg-gradient-to-b from-[#282828] to-[#1A1A1A]"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold font-inter text-[#E0E0E0] mb-2">Explore Movies</h1>
          <p className="text-[#A0A0A0] font-dmsans">Discover cinematic masterpieces from around the world</p>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#3A3A3A]"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A0A0A0]" />
              <Input
                type="text"
                placeholder="Search movies by title, director, actor..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-[#282828] border-[#3A3A3A] text-[#E0E0E0] placeholder:text-[#A0A0A0] focus:ring-[#00BFFF] focus:border-[#00BFFF]"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#E0E0E0]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            {isMobile && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(true)}
                className="bg-[#282828] border-[#3A3A3A] text-[#E0E0E0] hover:bg-[#3A3A3A]"
              >
                <Filter className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-[#282828] rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewModeChange("grid")}
                  className={cn(
                    "px-3",
                    viewMode === "grid"
                      ? "bg-[#00BFFF] text-white hover:bg-[#00BFFF]/90"
                      : "text-[#A0A0A0] hover:text-[#E0E0E0]",
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewModeChange("list")}
                  className={cn(
                    "px-3",
                    viewMode === "list"
                      ? "bg-[#00BFFF] text-white hover:bg-[#00BFFF]/90"
                      : "text-[#A0A0A0] hover:text-[#E0E0E0]",
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value: SortOption) => handleSortChange(value)}>
                <SelectTrigger className="w-[180px] bg-[#282828] border-[#3A3A3A] text-[#E0E0E0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#282828] border-[#3A3A3A]">
                  <SelectItem value="latest" className="text-[#E0E0E0]">
                    Latest Releases
                  </SelectItem>
                  <SelectItem value="score" className="text-[#E0E0E0]">
                    Highest SidduScore
                  </SelectItem>
                  <SelectItem value="popular" className="text-[#E0E0E0]">
                    Most Popular
                  </SelectItem>
                  <SelectItem value="alphabetical" className="text-[#E0E0E0]">
                    Alphabetical (A-Z)
                  </SelectItem>
                  <SelectItem value="alphabetical-desc" className="text-[#E0E0E0]">
                    Alphabetical (Z-A)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-[#A0A0A0]">{filteredMovies.length} movies found</div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <ActiveFilters
              filters={filters}
              onRemoveFilter={(type, value) => {
                const newFilters = { ...filters }
                if (type === "genre") {
                  newFilters.genres = filters.genres.filter((g) => g !== value)
                } else if (type === "country") {
                  newFilters.countries = filters.countries.filter((c) => c !== value)
                } else if (type === "language") {
                  newFilters.languages = filters.languages.filter((l) => l !== value)
                } else if (type === "status") {
                  newFilters.status = filters.status.filter((s) => s !== value)
                }
                handleFilterChange(newFilters)
              }}
              onClearAll={clearAllFilters}
            />
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar - Desktop */}
          {!isMobile && (
            <motion.aside className="w-64 flex-shrink-0" variants={itemVariants}>
              <FilterSidebar filters={filters} onFiltersChange={handleFilterChange} />
            </motion.aside>
          )}

          {/* Movie Display */}
          <motion.main className="flex-1" variants={itemVariants}>
            {isLoading ? (
              <LoadingState viewMode={viewMode} />
            ) : filteredMovies.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters || !!searchQuery} onClearFilters={clearAllFilters} />
            ) : (
              <AnimatePresence mode="wait">
                {viewMode === "grid" ? <MovieGrid movies={filteredMovies} /> : <MovieList movies={filteredMovies} />}
              </AnimatePresence>
            )}
          </motion.main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobile && showFilters && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#3A3A3A] z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-4 pb-safe">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#1A1A1A] pb-3 border-b border-[#3A3A3A]/50">
                  <h3 className="text-lg font-semibold text-[#E0E0E0]">Filters</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)} className="h-10 w-10">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <FilterSidebar filters={filters} onFiltersChange={handleFilterChange} />
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                  <Button className="flex-1 bg-[#00BFFF] hover:bg-[#00BFFF]/90" onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
