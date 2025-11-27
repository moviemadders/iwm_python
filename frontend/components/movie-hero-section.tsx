"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { Play, Plus, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

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
  const { trigger } = useHaptic()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Physics-based spring animations for parallax
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 }
  const y = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "50%"]), springConfig)
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.1]), springConfig)
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [1, 0]), springConfig)
  const textY = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 100]), springConfig)

  // Glitch effect state
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-[90vh] md:h-screen overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Immersive Backdrop with Parallax */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ y, scale }}
      >
        <Image
          src={movie.backdropUrl || "/placeholder.svg"}
          alt={`${movie.title} backdrop`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        
        {/* Animated Gradient Overlay - Cyberpunk Style - LIGHTENED */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-[#050505]/20" />
        
        {/* Subtle Neon Glow at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--primary)]/20 to-transparent blur-2xl" />
      </motion.div>

      {/* Content Container */}
      <motion.div 
        className="absolute inset-0 flex flex-col justify-end px-4 pb-24 md:pb-12 md:px-8 lg:px-16"
        style={{ opacity, y: textY }}
      >
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 md:gap-10 items-end">
            
            {/* Holographic Poster Card */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
              className="hidden md:block w-[240px] lg:w-[300px] relative group perspective-1000"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className={cn(
                "relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl transition-all duration-500",
                "border border-white/10 group-hover:border-[var(--primary)]/50",
                "group-hover:shadow-[0_0_30px_-5px_var(--primary)]"
              )}>
                <Image
                  src={movie.posterUrl || "/placeholder.svg"}
                  alt={`${movie.title} poster`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 180px, (max-width: 1024px) 220px, 300px"
                />
                {/* Glass Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>

            {/* Movie Details */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
              
              {/* Title & Score */}
              <div className="space-y-2">
                <motion.h1
                  className="text-4xl md:text-6xl lg:text-7xl font-bold font-inter tracking-tighter text-white drop-shadow-2xl"
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {movie.title}
                </motion.h1>
                
                <motion.div 
                  className="flex flex-wrap items-center justify-center md:justify-start gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {/* Neon Score Badge */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-[var(--primary)]/30">
                    <span className="text-[var(--primary)] font-bold text-lg drop-shadow-[0_0_8px_var(--primary)]">
                      {movie.sidduScore}
                    </span>
                    <span className="text-xs text-gray-100 uppercase tracking-widest">Siddu Score</span>
                  </div>

                  {/* Metadata Pills */}
                  <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{movie.year}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{movie.duration}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{movie.language}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--secondary)] border-[var(--secondary)]/30">{movie.rating}</span>
                  </div>
                </motion.div>
              </div>

              {/* Synopsis with Glass Expansion */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="max-w-2xl relative"
              >
                <p className={cn(
                  "text-gray-300 font-dmsans text-base md:text-lg leading-relaxed transition-all duration-500",
                  expanded ? "" : "line-clamp-3"
                )}>
                  {movie.synopsis}
                </p>
                {movie.synopsis.length > 150 && (
                  <button
                    onClick={() => {
                      setExpanded(!expanded)
                      trigger("light")
                    }}
                    className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors mt-2 text-sm font-semibold uppercase tracking-wider flex items-center gap-1"
                  >
                    {expanded ? "Show Less" : "Read More"}
                  </button>
                )}
              </motion.div>

              {/* Action Buttons - Glass & Neon */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              >
                {/* Watch Now - Always visible, disabled if no video */}
                <Button
                  className={cn(
                    "h-12 px-8 rounded-xl font-bold text-lg transition-all duration-300",
                    onWatchClick 
                      ? "bg-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/90 hover:scale-105 shadow-[0_0_20px_-5px_var(--primary)]"
                      : "bg-white/30 text-[var(--primary)] cursor-not-allowed border-2 border-white/40 shadow-[0_0_10px_-3px_rgba(255,255,255,0.5)]"
                  )}
                  onClick={() => {
                    if (onWatchClick) {
                      onWatchClick()
                      trigger("medium")
                    }
                  }}
                  disabled={!onWatchClick}
                  title={onWatchClick ? "Watch movie" : "Not available for streaming yet"}
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  {onWatchClick ? "Watch Now" : "Not Available Online"}
                </Button>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="h-12 px-4 glass-button text-white hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-md border-white/10"
                    onClick={() => {
                      onAddToWatchlist?.()
                      trigger("success")
                    }}
                    disabled={isAddingToWatchlist}
                  >
                    <Plus className={cn("mr-2 h-4 w-4 transition-transform", isAddingToWatchlist ? "rotate-45" : "")} />
                    Add to Watchlist
                  </Button>

                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 px-4 glass-button transition-all duration-300 backdrop-blur-md border-white/10",
                      isFavorited 
                        ? "text-[var(--secondary)] border-[var(--secondary)]/50 bg-[var(--secondary)]/10 hover:bg-[var(--secondary)]/20" 
                        : "text-white hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:bg-white/10"
                    )}
                    onClick={() => {
                      onToggleFavorite?.()
                      trigger(isFavorited ? "warning" : "success")
                    }}
                    disabled={isTogglingFavorite}
                  >
                    <Heart className={cn("mr-2 h-4 w-4", isFavorited ? "fill-current" : "")} />
                    {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-12 px-4 glass-button text-white hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-md border-white/10"
                    onClick={() => {
                      onAddToCollection?.()
                      trigger("success")
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Collection
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-12 px-4 glass-button text-white hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-md border-white/10"
                    onClick={() => {
                      onPlayTrailer?.()
                      trigger("light")
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Trailer
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
