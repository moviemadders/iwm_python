"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
  BadgeCheck,
  Flame,
  Zap,
  Laugh,
  Frown,
  Angry,
  Copy,
  Twitter,
  Facebook,
  Mail,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useMobile } from "@/hooks/use-mobile"


interface PulseCardProps {
  pulse: any // TODO: Type properly
  onReaction: (pulseId: string, type: string) => void
}

export default function PulseCard({ pulse, onReaction }: PulseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(pulse.engagement.hasBookmarked)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  const MAX_TEXT_LENGTH = 280
  const isTextLong = pulse.content.text.length > MAX_TEXT_LENGTH

  const [formattedTime, setFormattedTime] = useState("")

  useEffect(() => {
    setFormattedTime(formatDistanceToNow(new Date(pulse.timestamp), { addSuffix: true }))
  }, [pulse.timestamp])

  const reactions = [
    { type: "love", icon: Heart, color: "text-red-500" },
    { type: "fire", icon: Flame, color: "text-orange-500" },
    { type: "mindblown", icon: Zap, color: "text-yellow-500" },
    { type: "laugh", icon: Laugh, color: "text-green-500" },
    { type: "sad", icon: Frown, color: "text-blue-500" },
    { type: "angry", icon: Angry, color: "text-purple-500" },
  ]

  const getReactionIcon = (type?: string) => {
    if (!type) return Heart
    return reactions.find((r) => r.type === type)?.icon || Heart
  }

  const getReactionColor = (type?: string) => {
    if (!type) return "text-[#A0A0A0]"
    return reactions.find((r) => r.type === type)?.color || "text-[#A0A0A0]"
  }

  const handleCopyLink = () => {
    // In a real app, this would copy the actual URL
    navigator.clipboard.writeText(`https://siddu.com/pulse/${pulse.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setShowShareOptions(false)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // In a real app, this would call an API
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  const reactionVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    },
  }

  const reactionItemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  }

  const shareMenuVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.2 },
    },
  }

  // Format verification level badge
  const VerificationBadge = () => {
    if (!pulse.userInfo.isVerified) return null

    let badgeColor = "text-[#00BFFF]"
    let tooltipText = "Verified User"

    if (pulse.userInfo.verificationLevel === "industry") {
      badgeColor = "text-[#FFD700]"
      tooltipText = "Verified Industry Professional"
    } else if (pulse.userInfo.verificationLevel === "celebrity") {
      badgeColor = "text-[#FF4D4D]"
      tooltipText = "Verified Celebrity"
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <BadgeCheck className={`h-3.5 w-3.5 ${badgeColor}`} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <motion.div
      className="bg-[#282828] rounded-lg p-3 sm:p-4 border border-[#3A3A3A]"
      variants={cardVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={pulse.userInfo.avatarUrl || "/placeholder.svg"}
            alt={pulse.userInfo.displayName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap items-center gap-1 mb-1 min-w-0">
              <span className="font-semibold truncate">{pulse.userInfo.displayName}</span>
              <VerificationBadge />
              <span className="text-[#A0A0A0] text-xs sm:text-sm truncate">@{pulse.userInfo.username}</span>
              <span className="text-[#A0A0A0] text-xs sm:text-sm hidden xs:inline">·</span>
              {/* <span className="text-[#A0A0A0] text-xs sm:text-sm" suppressHydrationWarning>{formattedTime}</span> */}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A0A0A0]">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#282828] border-[#3A3A3A]">
                {!pulse.userInfo.isFollowing && (
                  <DropdownMenuItem className="text-[#E0E0E0]">Follow @{pulse.userInfo.username}</DropdownMenuItem>
                )}
                {pulse.userInfo.isFollowing && (
                  <DropdownMenuItem className="text-[#E0E0E0]">Unfollow @{pulse.userInfo.username}</DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-[#E0E0E0]">Not interested</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#3A3A3A]" />
                <DropdownMenuItem className="text-[#E0E0E0]" onClick={handleCopyLink}>
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[#E0E0E0]">Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Pulse Text */}
          <div className="mb-3">
            {isTextLong && !isExpanded ? (
              <>
                <p className="text-[#E0E0E0] whitespace-pre-line">
                  {pulse.content.text.substring(0, MAX_TEXT_LENGTH)}...
                </p>
                <button className="text-[#00BFFF] text-sm hover:underline mt-1" onClick={() => setIsExpanded(true)}>
                  Show more
                </button>
              </>
            ) : (
              <p className="text-[#E0E0E0] whitespace-pre-line">
                {pulse.content.text}
                {isTextLong && isExpanded && (
                  <button className="text-[#00BFFF] text-sm hover:underline ml-2" onClick={() => setIsExpanded(false)}>
                    Show less
                  </button>
                )}
              </p>
            )}
          </div>

          {/* Media Content */}
          {pulse.content.media && pulse.content.media.length > 0 && (
            <div className={`mb-3 grid ${pulse.content.media.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
              {pulse.content.media.map((item, index) => (
                <div key={index} className="relative rounded-md overflow-hidden">
                  <img
                    src={item.url || "/placeholder.svg"}
                    alt={`Media ${index + 1}`}
                    className="w-full object-cover"
                    style={{ maxHeight: pulse.content.media!.length > 1 ? "200px" : "400px" }}
                  />
                  {item.type === "video" && (
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Video
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Linked Content */}
          {pulse.content.linkedContent && (
            <div className="mb-3 bg-[#1A1A1A] rounded-md overflow-hidden border border-[#3A3A3A]">
              <div className="flex">
                {pulse.content.linkedContent.posterUrl && (
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={pulse.content.linkedContent.posterUrl || "/placeholder.svg"}
                      alt={pulse.content.linkedContent.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-xs text-[#00BFFF] uppercase mb-1">
                    {pulse.content.linkedContent.type === "movie" ? "Movie" : "Cricket Match"}
                  </div>
                  <div className="font-medium">{pulse.content.linkedContent.title}</div>
                </div>
              </div>
            </div>
          )}

          {/* Hashtags */}
          {pulse.content.hashtags && pulse.content.hashtags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {pulse.content.hashtags.map((tag, index) => (
                <span key={index} className="text-[#00BFFF] hover:underline cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Engagement Bar */}
          <div className="flex justify-between items-center mt-2 relative -mx-1">
            {/* Reaction Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm flex items-center gap-1 ${getReactionColor(pulse.engagement.userReaction)}`}
                onClick={() => setShowReactions(!showReactions)}
              >
                {(() => {
                  const ReactionIcon = getReactionIcon(pulse.engagement.userReaction)
                  return <ReactionIcon className="h-4 w-4" />
                })()}
                {pulse.engagement.reactions.total > 0 && (
                  <span>
                    {pulse.engagement.reactions.total > 1000
                      ? `${(pulse.engagement.reactions.total / 1000).toFixed(1)}K`
                      : pulse.engagement.reactions.total}
                  </span>
                )}
              </Button>

              {/* Reaction Picker */}
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    className="absolute bottom-full left-0 mb-2 bg-[#1A1A1A] rounded-full p-1 border border-[#3A3A3A] flex gap-1 z-10"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={reactionVariants}
                  >
                    {reactions.map((reaction) => (
                      <motion.button
                        key={reaction.type}
                        className={`p-1.5 rounded-full hover:bg-[#282828] ${pulse.engagement.userReaction === reaction.type ? "bg-[#282828]" : ""
                          }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onReaction(pulse.id, reaction.type)
                          setShowReactions(false)
                        }}
                        variants={reactionItemVariants}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <reaction.icon className={`h-5 w-5 ${reaction.color}`} />
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comment Button */}
            <Button variant="ghost" size="sm" className="text-sm flex items-center gap-1 text-[#A0A0A0]">
              <MessageCircle className="h-4 w-4" />
              {pulse.engagement.comments > 0 && (
                <span>
                  {pulse.engagement.comments > 1000
                    ? `${(pulse.engagement.comments / 1000).toFixed(1)}K`
                    : pulse.engagement.comments}
                </span>
              )}
            </Button>

            {/* Share Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm flex items-center gap-1 text-[#A0A0A0]"
                onClick={() => setShowShareOptions(!showShareOptions)}
              >
                <Share className="h-4 w-4" />
                {pulse.engagement.shares > 0 && (
                  <span>
                    {pulse.engagement.shares > 1000
                      ? `${(pulse.engagement.shares / 1000).toFixed(1)}K`
                      : pulse.engagement.shares}
                  </span>
                )}
              </Button>

              {/* Share Options */}
              <AnimatePresence>
                {showShareOptions && (
                  <motion.div
                    ref={shareMenuRef}
                    className="absolute bottom-full right-0 mb-2 bg-[#1A1A1A] rounded-lg p-2 border border-[#3A3A3A] z-10 w-48"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={shareMenuVariants}
                  >
                    <div className="space-y-1">
                      <button
                        className="flex items-center gap-2 w-full p-2 text-sm text-[#E0E0E0] hover:bg-[#282828] rounded-md"
                        onClick={handleCopyLink}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied!" : "Copy link"}
                      </button>
                      <button className="flex items-center gap-2 w-full p-2 text-sm text-[#E0E0E0] hover:bg-[#282828] rounded-md">
                        <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                        Share on Twitter
                      </button>
                      <button className="flex items-center gap-2 w-full p-2 text-sm text-[#E0E0E0] hover:bg-[#282828] rounded-md">
                        <Facebook className="h-4 w-4 text-[#4267B2]" />
                        Share on Facebook
                      </button>
                      <button className="flex items-center gap-2 w-full p-2 text-sm text-[#E0E0E0] hover:bg-[#282828] rounded-md">
                        <Mail className="h-4 w-4 text-[#EA4335]" />
                        Share via Email
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bookmark Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`text-sm ${isBookmarked ? "text-[#00BFFF]" : "text-[#A0A0A0]"}`}
              onClick={handleBookmark}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
