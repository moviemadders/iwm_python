"use client"

import { motion } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"

interface ProfileNavigationProps {
  activeSection: string
  onSectionChange: (section: any) => void
  stats: {
    reviews: number
    watchlist: number
    favorites: number
    collections: number
    following: number
    followers: number
  }
  isOwnProfile?: boolean
}

export function ProfileNavigation({ activeSection, onSectionChange, stats, isOwnProfile = false }: ProfileNavigationProps) {
  const isMobile = useMobile()

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "pulse", label: "Pulse" },
    { id: "reviews", label: "Reviews", count: stats.reviews },
    { id: "watchlist", label: "Watchlist", count: stats.watchlist },
    { id: "favorites", label: "Favorites", count: stats.favorites },
    { id: "collections", label: "Collections", count: stats.collections },
    { id: "history", label: "History" },
    ...(isOwnProfile ? [{ id: "settings", label: "Settings" }] : []),
  ]

  return (
    <div className="mt-6 md:mt-8 border-b border-[#3A3A3A]">
      <div className="flex overflow-x-auto scrollbar-hide">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`relative px-4 py-3 font-inter text-sm md:text-base whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-[#00BFFF] focus:ring-inset ${
              activeSection === section.id ? "text-[#E0E0E0]" : "text-[#A0A0A0] hover:text-[#E0E0E0]"
            }`}
            onClick={() => onSectionChange(section.id)}
          >
            <div className="flex items-center">
              <span>{section.label}</span>
              {section.count !== undefined && (
                <span
                  className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    activeSection === section.id ? "bg-[#00BFFF] text-[#1A1A1A]" : "bg-[#3A3A3A] text-[#A0A0A0]"
                  }`}
                >
                  {section.count}
                </span>
              )}
            </div>

            {activeSection === section.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00BFFF]"
                layoutId="activeTab"
                initial={false}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
