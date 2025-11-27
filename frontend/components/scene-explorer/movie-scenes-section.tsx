"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Play, ChevronRight, Filter, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHaptic } from "@/hooks/use-haptic"
import { mockScenes } from "./mock-data"
import type { Scene } from "./types"
import { cn } from "@/lib/utils"

interface MovieScenesProps {
  movieId: string
  movieTitle: string
  limit?: number
  showViewAll?: boolean
}

export function MovieScenesSection({ movieId, movieTitle, limit = 4, showViewAll = true }: MovieScenesProps) {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const { trigger } = useHaptic()

  const sceneTypes = ["all", "action", "dialogue", "emotional", "vfx", "one-shot"]

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      const filteredScenes = mockScenes.filter((scene) => scene.movieId === movieId)
      setScenes(filteredScenes)
      setIsLoading(false)
    }, 500)
  }, [movieId])

  const filteredScenes = activeFilter === "all" ? scenes : scenes.filter((scene) => scene.sceneType === activeFilter)
  const displayedScenes = filteredScenes.slice(0, limit)

  if (isLoading) {
    return <ScenesSkeleton />
  }

  if (scenes.length === 0) {
    return null
  }

  return (
    <section className="w-full py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-[var(--secondary)] rounded-full shadow-[0_0_10px_var(--secondary)]" />
            <h2 className="text-2xl md:text-3xl font-bold font-inter text-white">Iconic Scenes</h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="glass-button border-white/10 text-gray-300 hover:text-white hover:border-[var(--primary)]/50"
                  onClick={() => trigger("light")}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="capitalize">{activeFilter === "all" ? "All Types" : activeFilter}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#111] border-white/10 text-gray-200 backdrop-blur-xl">
                {sceneTypes.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    className={cn(
                      "cursor-pointer focus:bg-[var(--primary)]/20 focus:text-[var(--primary)]",
                      activeFilter === type && "text-[var(--primary)] font-medium"
                    )}
                    onClick={() => {
                      setActiveFilter(type)
                      trigger("medium")
                    }}
                  >
                    <span className="capitalize">{type}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {showViewAll && scenes.length > limit && (
              <Button variant="ghost" size="sm" className="hidden sm:flex text-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10" asChild>
                <Link href={`/scene-explorer?movie=${movieId}`}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {displayedScenes.map((scene) => (
              <motion.div
                key={scene.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="group relative"
              >
                <Link 
                  href={`/scene-explorer?scene=${scene.id}`} 
                  className="block h-full"
                  onClick={() => trigger("medium")}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group-hover:border-[var(--primary)]/50 transition-all duration-300 shadow-lg group-hover:shadow-[0_0_20px_-5px_var(--primary)]">
                    <Image 
                      src={scene.thumbnail || "/placeholder.svg"} 
                      alt={scene.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
                      <div className="bg-[var(--primary)] text-black rounded-full p-4 shadow-[0_0_20px_var(--primary)]">
                        <Play className="h-6 w-6 fill-current" />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {scene.isVisualTreat && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 border-0 text-white shadow-lg flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Visual Treat
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md rounded px-2 py-1 border border-white/10">
                      <span className="text-xs font-bold text-white font-mono">{scene.duration}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="font-semibold text-white group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                      {scene.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-400 font-dmsans">
                      <span className="capitalize px-2 py-0.5 rounded bg-white/5 border border-white/5">
                        {scene.sceneType}
                      </span>
                      <span>{(scene.viewCount / 1000).toFixed(1)}K views</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {showViewAll && scenes.length > limit && (
          <div className="flex justify-center mt-8 sm:hidden">
            <Button variant="outline" className="w-full glass-button text-[var(--primary)] border-[var(--primary)]/30" asChild>
              <Link href={`/scene-explorer?movie=${movieId}`}>
                View All Scenes <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

function ScenesSkeleton() {
  return (
    <div className="w-full py-12 max-w-7xl mx-auto px-4">
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-white/5 border border-white/5">
            <div className="aspect-video bg-white/5 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
