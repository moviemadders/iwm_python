'use client'

/**
 * Tagged Item Card Component
 * Displays tagged movies or cricket matches
 */

import { TaggedItem } from '@/types/pulse'
import { ChevronRight, Star, Film } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface TaggedItemCardProps {
  tag: TaggedItem
}

export default function TaggedItemCard({ tag }: TaggedItemCardProps) {
  const [imageError, setImageError] = useState(false)

  if (tag.type === 'movie') {
    return (
      <Link href={`/movies/${tag.id}`}>
        <div className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--primary)]/30 rounded-xl cursor-pointer transition-all duration-300 group">
          {/* Poster */}
          <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black/40">
            {!imageError ? (
              <Image
                src={tag.poster_url || "/placeholder.svg"}
                alt={tag.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Film size={24} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-100 font-inter group-hover:text-[var(--primary)] transition-colors truncate">
              {tag.title}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              {tag.rating && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-[var(--primary)] fill-[var(--primary)]" />
                  <span>{tag.rating}</span>
                </div>
              )}
              {tag.rating && <span>•</span>}
              <span>{tag.year}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--primary)] mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
              <span>View details</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Cricket match
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--primary)]/30 rounded-xl cursor-pointer transition-all duration-300 group">
      {/* Live Indicator */}
      {tag.status === 'live' && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
          <span className="text-xs font-bold text-red-500 tracking-wider">LIVE</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1">
        <h4 className="font-semibold text-gray-100 font-inter group-hover:text-[var(--primary)] transition-colors">
          {tag.team1} vs {tag.team2}
        </h4>
        {tag.score && (
          <p className="text-sm text-gray-400 mt-1 font-mono">{tag.score}</p>
        )}
        {tag.venue && (
          <p className="text-xs text-gray-500 mt-1 truncate">{tag.venue}</p>
        )}
      </div>

      <ChevronRight size={16} className="text-gray-500 group-hover:text-[var(--primary)] transition-colors" />
    </div>
  )
}

