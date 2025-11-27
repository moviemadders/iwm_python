"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ChevronRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

interface Person {
  id: string
  name: string
  role: string
  profileUrl?: string
}

interface CastMember extends Person {
  character: string
}

interface MovieInfoSectionProps {
  movie: {
    directors: Person[]
    writers: Person[]
    producers: Person[]
    genres: string[]
    cast: CastMember[]
  }
}

export function MovieInfoSection({ movie }: MovieInfoSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const { trigger } = useHaptic()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

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
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 20
      } 
    },
  }

  return (
    <motion.section
      ref={ref}
      className="w-full max-w-7xl mx-auto px-4 py-12 md:py-16 relative z-10"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Section Title with Neon Accent */}
      <motion.div className="flex items-center gap-4 mb-8" variants={itemVariants}>
        <div className="h-8 w-1 bg-[var(--primary)] rounded-full shadow-[0_0_10px_var(--primary)]" />
        <h2 className="text-2xl md:text-3xl font-bold font-inter text-white tracking-tight">
          Behind the Scenes
        </h2>
      </motion.div>

      {/* Details Grid - Glass Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12" variants={itemVariants}>
        {[
          { title: "Directors", people: movie.directors },
          { title: "Writers", people: movie.writers },
          { title: "Producers", people: movie.producers }
        ].map((group, idx) => (
          <motion.div 
            key={group.title}
            className="glass-panel p-6 rounded-xl hover:bg-white/10 transition-colors duration-300"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-[var(--primary)] font-dmsans text-sm uppercase tracking-wider font-semibold mb-2 block">
              {group.title}
            </span>
            <div className="flex flex-wrap gap-2">
              {group.people.map((person, index) => (
                <span key={person.id} className="text-gray-300 font-dmsans text-lg">
                  <Link 
                    href={`/person/${person.id}`} 
                    className="hover:text-white hover:underline decoration-[var(--primary)] underline-offset-4 transition-all"
                    onClick={() => trigger("light")}
                  >
                    {person.name}
                  </Link>
                  {index < group.people.length - 1 && <span className="text-gray-600 mr-2">,</span>}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Genre Tags - Neon Pills */}
      <motion.div className="flex flex-wrap gap-3 mb-16" variants={itemVariants}>
        {movie.genres.map((genre) => (
          <motion.div 
            key={genre} 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href={`/movies/genre/${genre.toLowerCase()}`} onClick={() => trigger("light")}>
              <Badge
                className="bg-transparent border border-white/20 text-gray-300 hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all duration-300 px-4 py-2 text-sm font-medium cursor-pointer rounded-full"
                variant="outline"
              >
                {genre}
              </Badge>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Cast Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-[var(--secondary)] rounded-full shadow-[0_0_10px_var(--secondary)]" />
            <h3 className="text-2xl font-bold font-inter text-white">Top Cast</h3>
          </div>
          
          <Button
            variant="ghost"
            className="text-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 font-inter group"
            asChild
            onClick={() => trigger("light")}
          >
            <Link href="#">
              See All
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Cast Carousel with Snap Scroll */}
        <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
          <div
            ref={carouselRef}
            className="flex overflow-x-auto pb-8 space-x-4 scrollbar-hide snap-x snap-mandatory pt-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {movie.cast.map((actor, index) => (
              <motion.div
                key={actor.id}
                className="flex-shrink-0 w-[160px] md:w-[180px] snap-start"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05, type: "spring" }}
              >
                <Link href={`/person/${actor.id}`} onClick={() => trigger("light")}>
                  <motion.div
                    className="group relative bg-[#111] rounded-2xl overflow-hidden border border-white/5 hover:border-[var(--primary)]/50 transition-colors duration-300"
                    whileHover={{ y: -10 }}
                  >
                    {/* Image Container */}
                    <div className="aspect-[3/4] overflow-hidden relative">
                      {actor.profileUrl ? (
                        <Image
                          src={actor.profileUrl || "/placeholder.svg"}
                          alt={actor.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-gray-600">
                          <User size={48} />
                        </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    </div>

                    {/* Text Content */}
                    <div className="p-4 relative">
                      <h4 className="font-inter font-bold text-white text-lg leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                        {actor.name}
                      </h4>
                      <p className="text-gray-400 text-sm font-dmsans mt-1 line-clamp-1">
                        {actor.character}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {/* Fade edges for scroll indication */}
          <div className="absolute top-0 right-0 bottom-8 w-24 bg-gradient-to-l from-black to-transparent pointer-events-none md:hidden" />
        </div>
      </motion.div>
    </motion.section>
  )
}
