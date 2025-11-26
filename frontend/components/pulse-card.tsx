"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Repeat, Check, MoreHorizontal } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Pulse {
  id: string
  userId: string
  username: string
  isVerified: boolean
  avatarUrl?: string
  timestamp: string
  content: string
  hashtags: string[]
  contentMedia?: string[]
  linkedMovieId?: string
  linkedMovieTitle?: string
  linkedMoviePoster?: string
  likes: number
  comments: number
  shares: number
  userHasLiked: boolean
}

interface PulseCardProps {
  pulse: Pulse
}

export function PulseCard({ pulse }: PulseCardProps) {
  const [liked, setLiked] = useState(pulse.userHasLiked)
  const [likeCount, setLikeCount] = useState(pulse.likes)
  const [expanded, setExpanded] = useState(false)

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1)
    } else {
      setLikeCount((prev) => prev + 1)
    }
    setLiked(!liked)
  }

  // Format content with hashtags
  const formatContent = (content: string, hashtags: string[]) => {
    if (!hashtags.length) return content

    let formattedContent = content
    hashtags.forEach((tag) => {
      formattedContent = formattedContent.replace(
        `#${tag}`,
        `<span class="text-[#00BFFF] hover:underline cursor-pointer">#${tag}</span>`,
      )
    })

    return formattedContent
  }

  const formattedContent = formatContent(pulse.content, pulse.hashtags)
  const isLongContent = pulse.content.length > 180

  return (
    <Card className="bg-[#282828] border-none shadow-md hover:bg-[#2A2A2A] transition-colors overflow-hidden">
      <motion.div className="p-4" whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
        {/* Card Header */}
        <div className="flex items-start mb-3">
          <Link href={`/users/${pulse.userId}`} className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#3A3A3A]">
              {pulse.avatarUrl ? (
                <Image
                  src={pulse.avatarUrl || "/placeholder.svg"}
                  alt={pulse.username}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#A0A0A0]">
                  {pulse.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1">
            <div className="flex items-center">
              <Link
                href={`/users/${pulse.userId}`}
                className="font-inter font-medium text-[#E0E0E0] hover:text-[#00BFFF] transition-colors"
              >
                {pulse.username}
              </Link>

              {pulse.isVerified && (
                <div className="ml-1 text-[#00BFFF]">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <span className="ml-2 text-[#A0A0A0] text-xs md:text-sm font-dmsans">{pulse.timestamp}</span>
            </div>
          </div>

          <button className="text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Card Content */}
        <div className="mb-3">
          {isLongContent && !expanded ? (
            <>
              <div
                className="text-[#E0E0E0] font-dmsans line-clamp-3"
                dangerouslySetInnerHTML={{ __html: formattedContent }}
              />
              <button
                onClick={() => setExpanded(true)}
                className="text-[#00BFFF] hover:text-[#00A3DD] transition-colors mt-1 font-dmsans text-sm"
              >
                Read more
              </button>
            </>
          ) : (
            <div className="text-[#E0E0E0] font-dmsans" dangerouslySetInnerHTML={{ __html: formattedContent }} />
          )}
        </div>

        {/* Media Gallery */}
        {pulse.contentMedia && pulse.contentMedia.length > 0 && (
          <div className={`mb-3 overflow-hidden rounded-lg ${pulse.contentMedia.length === 1 ? "max-h-96" : "grid grid-cols-2 gap-2"}`}>
            {pulse.contentMedia.map((mediaUrl, index) => {
              const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i);
              return (
                <div key={index} className="relative bg-[#1A1A1A] overflow-hidden rounded-lg">
                  {isVideo ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={mediaUrl}
                      alt={`Media ${index + 1}`}
                      width={pulse.contentMedia!.length === 1 ? 600 : 300}
                      height={pulse.contentMedia!.length === 1 ? 400 : 200}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Linked Movie */}
        {pulse.linkedMovieId && pulse.linkedMovieTitle && (
          <Link href={`/movies/${pulse.linkedMovieId}`}>
            <div className="mb-3 p-3 bg-[#1A1A1A] rounded-lg border border-[#3A3A3A] hover:border-[#00BFFF] transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                {pulse.linkedMoviePoster && (
                  <div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden">
                    <Image
                      src={pulse.linkedMoviePoster}
                      alt={pulse.linkedMovieTitle}
                      width={48}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[#E0E0E0] font-inter font-medium">{pulse.linkedMovieTitle}</p>
                  <p className="text-[#A0A0A0] text-sm font-dmsans">View movie</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <motion.button
              className={`flex items-center space-x-1 ${liked ? "text-[#FF4D6D]" : "text-[#A0A0A0]"} hover:text-[#FF4D6D] transition-colors`}
              onClick={handleLike}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </motion.button>

            <button className="flex items-center space-x-1 text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>{pulse.comments}</span>
            </button>

            <button className="flex items-center space-x-1 text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors">
              <Repeat className="w-4 h-4" />
              <span>{pulse.shares}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </Card>
  )
}
