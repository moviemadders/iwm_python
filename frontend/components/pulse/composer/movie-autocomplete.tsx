"use client"

import { useState, useCallback } from "react"
import { Search, X } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { searchMovies } from "@/lib/api/movies"

interface Movie {
  id: string
  title: string
  posterUrl?: string
  releaseYear?: number
}

interface MovieAutocompleteProps {
  onSelectMovie: (movie: Movie) => void
  selectedMovie: Movie | null
  onClear: () => void
}

export function MovieAutocomplete({ onSelectMovie, selectedMovie, onClear }: MovieAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Movie[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const data = await searchMovies(searchQuery)
      setResults(data.slice(0, 5)) // Limit to 5 results
      setIsOpen(true)
    } catch (error) {
      console.error("Error searching movies:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
  }

  const handleSelect = (movie: Movie) => {
    onSelectMovie(movie)
    setQuery("")
    setResults([])
    setIsOpen(false)
  }

  if (selectedMovie) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-[#1A1A1A] rounded-lg border border-[#3A3A3A]">
        {selectedMovie.posterUrl && (
          <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
            <Image
              src={selectedMovie.posterUrl}
              alt={selectedMovie.title}
              width={48}
              height={64}
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <p className="text-[#E0E0E0] font-inter font-medium">{selectedMovie.title}</p>
          {selectedMovie.releaseYear && (
            <p className="text-[#A0A0A0] text-sm font-dmsans">{selectedMovie.releaseYear}</p>
          )}
        </div>
        <button
          onClick={onClear}
          className="text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for a movie to link..."
          className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-[#E0E0E0] placeholder-[#7A7A7A] focus:outline-none focus:border-[#00BFFF] transition-colors font-dmsans text-sm"
        />
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-[#282828] border border-[#3A3A3A] rounded-lg shadow-xl overflow-hidden"
          >
            {results.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleSelect(movie)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-[#1A1A1A] transition-colors text-left"
                type="button"
              >
                {movie.posterUrl && (
                  <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      width={40}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[#E0E0E0] font-inter font-medium text-sm">{movie.title}</p>
                  {movie.releaseYear && (
                    <p className="text-[#A0A0A0] text-xs font-dmsans">{movie.releaseYear}</p>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-[#00BFFF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
