"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { Play, Plus, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MovieHeroSectionProps {
  movie: {
    id: string
    title: string
    backdropUrl: string
    posterUrl: string
    year: string
    duration: string
    language: string
    rating: string
    sidduScore: number
    criticsScore?: number
    synopsis: string
  }
  onAddToWatchlist?: () => void
  isAddingToWatchlist?: boolean
  onAddToCollection?: () => void
  onToggleFavorite?: () => void
  isFavorited?: boolean
  isTogglingFavorite?: boolean
  onPlayTrailer?: () => void
  onWatchClick?: () => void
}

export function MovieHeroSection({
  movie,
  onAddToWatchlist,
  isAddingToWatchlist,
  onAddToCollection,
  onToggleFavorite,
  isFavorited = false,
  isTogglingFavorite = false,
  onPlayTrailer,
  onWatchClick
}: MovieHeroSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, 1.05])
  const opacityOverlay = useTransform(scrollYProgress, [0, 0.8], [0.6, 0.9])

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Backdrop Image with Parallax */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          y: parallaxY,
          scale: parallaxScale,
        }}
      >
        <Image
          src={movie.backdropUrl || "/placeholder.svg"}
          alt={`${movie.title} backdrop`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>

      {/* Gradient Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/70 to-transparent"
        style={{ opacity: opacityOverlay }}
      />

      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-end px-4 pb-8 md:pb-12 md:px-8 lg:px-16">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 md:gap-8">
            {/* Movie Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mx-auto md:mx-0 w-[180px] md:w-[220px] lg:w-[280px]"
            >
              <div className="relative aspect-[2/3] rounded-lg shadow-lg overflow-hidden">
                <Image
                  src={movie.posterUrl || "/placeholder.svg"}
                  alt={`${movie.title} poster`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 180px, (max-width: 1024px) 220px, 280px"
                />
              </div>
            </motion.div>

            {/* Movie Details */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="space-y-4">
                {/* Title and Score */}
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <motion.h1
                    className="text-3xl md:text-4xl lg:text-5xl font-bold font-inter text-[#E0E0E0]"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {movie.title}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="flex items-center justify-center"
                  >
                    <div className="bg-[#00BFFF] text-[#1A1A1A] rounded-full h-12 w-12 flex items-center justify-center font-inter font-bold text-lg">
                      {movie.sidduScore}
                    </div>
                  </motion.div>
                </div>

                {/* Metadata */}
                <motion.div
                  className="flex flex-wrap justify-center md:justify-start gap-2 text-sm font-dmsans text-[#A0A0A0]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <span>{movie.year}</span>
                  <span>•</span>
                  <span>{movie.duration}</span>
                  <span>•</span>
                  <span>{movie.language}</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 bg-[#282828] rounded text-xs">{movie.rating}</span>
                </motion.div>

                {/* Synopsis */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="mt-2"
                >
                  <p className={`text-[#E0E0E0] font-dmsans ${expanded ? "" : "line-clamp-3"}`}>{movie.synopsis}</p>
                  {movie.synopsis.length > 150 && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-[#00BFFF] hover:text-[#00A3DD] transition-colors mt-1 font-dmsans text-sm"
                    >
                      {expanded ? "Show Less" : "Read More"}
                    </button>
                  )}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  {onWatchClick && (
                    <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                      <Button
                        className="w-full sm:w-auto bg-[#00BFFF] text-[#1A1A1A] hover:bg-[#00A3DD] font-inter font-bold"
                        onClick={onWatchClick}
                      >
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        Watch Now
                      </Button>
                    </motion.div>
                  )}


                  <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-[#00BFFF] text-[#E0E0E0] hover:bg-[#00BFFF]/10 font-inter"
                      onClick={onAddToWatchlist}
                      disabled={isAddingToWatchlist}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isAddingToWatchlist ? "Adding..." : "Add to Watchlist"}
                    </Button>
                  </motion.div>

                  {onToggleFavorite && (
                    <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                      <Button
                        variant="outline"
                        className={`w-full sm:w-auto font-inter ${isFavorited
                          ? "border-[#FF1744] text-[#FF1744] hover:bg-[#FF1744]/10"
                          : "border-[#E0E0E0] text-[#E0E0E0] hover:bg-[#E0E0E0]/10"
                          }`}
                        onClick={onToggleFavorite}
                        disabled={isTogglingFavorite}
                      >
                        <Heart className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                        {isTogglingFavorite
                          ? "Updating..."
                          : isFavorited
                            ? "Remove from Favorites"
                            : "Add to Favorites"}
                      </Button>
                    </motion.div>
                  )}

                  {onAddToCollection && (
                    <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto border-[#FFD700] text-[#E0E0E0] hover:bg-[#FFD700]/10 font-inter"
                        onClick={onAddToCollection}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Collection
                      </Button>
                    </motion.div>
                  )}

                  <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-[#A0A0A0] text-[#E0E0E0] hover:bg-[#282828] font-inter"
                      onClick={onPlayTrailer}
                    >
                      <Play className="mr-2 h-4 w-4 fill-current" />
                      Trailer
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
