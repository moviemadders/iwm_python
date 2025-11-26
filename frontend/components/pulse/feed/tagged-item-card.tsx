'use client'

/**
 * Tagged Item Card Component
 * Displays tagged movies or cricket matches
 */

import { TaggedItem } from '@/types/pulse'
import { ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'

interface TaggedItemCardProps {
  tag: TaggedItem
}

export default function TaggedItemCard({ tag }: TaggedItemCardProps) {
  if (tag.type === 'movie') {
    return (
      <Link href={`/movies/${tag.id}`}>
        <div className="flex items-center gap-3 p-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] rounded-lg cursor-pointer transition-colors group">
          {/* Poster */}
          <img
            src={tag.poster_url}
            alt={tag.title}
            className="w-16 h-24 object-cover rounded"
          />

          {/* Info */}
          <div className="flex-1">
            <h4 className="font-semibold text-[#E0E0E0] font-['Inter'] group-hover:text-[#00BFFF] transition-colors">
              {tag.title}
            </h4>
            <div className="flex items-center gap-2 text-sm text-[#A0A0A0] mt-1">
              {tag.rating && (
                <>
                  <Star size={14} className="text-[#FFD700]" fill="#FFD700" />
                  <span>{tag.rating}</span>
                  <span>•</span>
                </>
              )}
              <span>{tag.year}</span>
              {tag.genre && (
                <>
                  <span>•</span>
                  <span>{tag.genre}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-[#00BFFF] mt-2">
              <span>View movie details</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Cricket match
  return (
    <div className="flex items-center gap-3 p-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] rounded-lg cursor-pointer transition-colors group">
      {/* Live Indicator */}
      {tag.status === 'live' && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-red-500">LIVE</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1">
        <h4 className="font-semibold text-[#E0E0E0] font-['Inter']">
          {tag.team1} vs {tag.team2}
        </h4>
        {tag.score && (
          <p className="text-sm text-[#A0A0A0] mt-1">{tag.score}</p>
        )}
        {tag.venue && (
          <p className="text-xs text-[#A0A0A0] mt-1">{tag.venue}</p>
        )}
      </div>

      <ChevronRight size={16} className="text-[#A0A0A0] group-hover:text-[#00BFFF] transition-colors" />
    </div>
  )
}

