"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Info, Star, Users, Clock, Film, Lightbulb, Trophy } from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

interface MovieDetailsNavigationProps {
  movieId: string
  movieTitle: string
}

export function MovieDetailsNavigation({ movieId, movieTitle }: MovieDetailsNavigationProps) {
  const pathname = usePathname()
  const { trigger } = useHaptic()

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <Info className="w-4 h-4 mr-2" />,
      href: `/movies/${movieId}`,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <Star className="w-4 h-4 mr-2" />,
      href: `/movies/${movieId}/reviews`,
    },
    {
      id: "cast",
      label: "Cast & Crew",
      icon: <Users className="w-4 h-4 mr-2" />,
      href: `/movies/${movieId}/cast`,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: <Clock className="w-4 h-4 mr-2" />,
      href: `/movies/${movieId}/timeline`,
    },
    {
      id: "scenes",
      label: "Scenes",
      icon: <Film className="w-4 h-4 mr-2" />,
      href: `/movies/${movieId}/scenes`,
    },
    {
      id: "trivia",
      label: "Trivia",
      icon: <Lightbulb className="w-4 h-4 mr-2" />,
      href: `/movies/${movieId}/trivia`,
    },
    {
      id: "awards",
      label: "Awards",
      icon: <Trophy className="w-4 h-4 mr-2" />,
      href: `/movies/${movieId}/awards`,
    },
  ]

  const getActiveTab = () => {
    if (pathname === `/movies/${movieId}`) return "overview"
    if (pathname.includes("/reviews")) return "reviews"
    if (pathname.includes("/cast")) return "cast"
    if (pathname.includes("/timeline")) return "timeline"
    if (pathname.includes("/scenes")) return "scenes"
    if (pathname.includes("/trivia")) return "trivia"
    if (pathname.includes("/awards")) return "awards"
    return "overview"
  }

  const activeTab = getActiveTab()

  return (
    <div className="sticky top-14 md:top-16 z-40 w-full">
      {/* Glassmorphism Container */}
      <div className="bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <nav className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => trigger("light")}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300 snap-start rounded-full mx-1",
                    isActive 
                      ? "text-[var(--primary)] bg-[var(--primary)]/10" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className={cn("flex-shrink-0 transition-colors", isActive ? "text-[var(--primary)]" : "text-gray-500 group-hover:text-white")}>
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-[var(--primary)]/30"
                      layoutId="activeTabBorder"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
