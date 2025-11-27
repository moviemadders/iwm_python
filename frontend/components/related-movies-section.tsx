"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

interface Movie {
  id: string
  title: string
  posterUrl: string
  sidduScore: number
}

interface RelatedMoviesSectionProps {
  movies: Movie[]
}

export function RelatedMoviesSection({ movies }: RelatedMoviesSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { trigger } = useHaptic()

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Check scroll position to update arrow visibility
  const checkScrollPosition = () => {
    if (!carouselRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10) // 10px buffer
  }

  useEffect(() => {
    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener("scroll", checkScrollPosition)
      checkScrollPosition()
      return () => carousel.removeEventListener("scroll", checkScrollPosition)
    }
  }, [])

  const scroll = (direction: "left" | "right") => {
    trigger("medium")
    if (!carouselRef.current) return

    const carousel = carouselRef.current
    const cardWidth = carousel.querySelector("div")?.clientWidth || 0
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth

    carousel.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: 0.2 + custom * 0.05,
      },
    }),
  }

  return (
    <motion.section
      ref={containerRef}
      className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div className="flex items-center gap-4" variants={itemVariants}>
            <div className="h-8 w-1 bg-[var(--primary)] rounded-full shadow-[0_0_10px_var(--primary)]" />
            <h2 className="text-2xl md:text-3xl font-bold font-inter text-white">More Like This</h2>
        </motion.div>
      </div>

      {/* Carousel Container */}
      <motion.div className="relative" variants={itemVariants}>
        {/* Navigation Arrows (Desktop Only) */}
        {!isMobile && (
          <>
            <motion.button
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 backdrop-blur-md border border-white/10 rounded-full p-3 text-white shadow-lg hover:bg-[var(--primary)] hover:text-black transition-all duration-300",
                !canScrollLeft ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
              onClick={() => scroll("left")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 backdrop-blur-md border border-white/10 rounded-full p-3 text-white shadow-lg hover:bg-[var(--primary)] hover:text-black transition-all duration-300",
                !canScrollRight ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
              onClick={() => scroll("right")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </>
        )}

        {/* Carousel Track */}
        <div
          ref={carouselRef}
          className="flex overflow-x-auto pb-8 space-x-4 scrollbar-hide snap-x snap-mandatory pt-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={checkScrollPosition}
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              className="flex-shrink-0 w-[160px] md:w-[200px] snap-start"
              custom={index}
              variants={cardVariants}
            >
              <Link href={`/movies/${movie.id}`} onClick={() => trigger("light")}>
                <motion.div
                  className="group relative bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-[var(--primary)]/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_-5px_var(--primary)]"
                  whileHover={{ y: -10 }}
                >
                  {/* Movie Poster */}
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <Image
                      src={movie.posterUrl || "/placeholder.svg"}
                      alt={movie.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 160px, 200px"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* SidduScore Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-[var(--primary)]/30 text-[var(--primary)] rounded-full h-8 w-8 flex items-center justify-center font-inter font-bold text-sm shadow-lg">
                      {movie.sidduScore}
                    </div>
                  </div>
                  
                  {/* Movie Title */}
                  <div className="p-4 relative">
                    <h3 className="font-inter font-bold text-white text-sm line-clamp-1 group-hover:text-[var(--primary)] transition-colors">{movie.title}</h3>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center md:hidden pb-2">
          <div className="flex space-x-1">
            {[...Array(Math.min(5, movies.length))].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-[var(--primary)]" : "bg-white/10"}`} />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.section>
  )
}
