"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ImageIcon,
  Smile,
  Hash,
  Link2,
  Send,
  FilmIcon as MovieIcon,
  BirdIcon as Cricket,
  Search,
  Plus,
  Star,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { PulseType } from "./types"
import { v4 as uuidv4 } from "uuid"
import { useMobile } from "@/hooks/use-mobile"

interface PulseComposerProps {
  onClose: () => void
  onSubmit: (pulse: PulseType) => void
}

interface MediaItem {
  type: string
  url: string
  thumbnailUrl?: string
}

interface LinkedContent {
  type: "movie" | "cricket"
  id: string
  title: string
  posterUrl?: string
}

export function PulseComposer({ onClose, onSubmit }: PulseComposerProps) {
  const [text, setText] = useState("")
  const [media, setMedia] = useState<MediaItem[]>([])
  const [linkedContent, setLinkedContent] = useState<LinkedContent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMediaDialog, setShowMediaDialog] = useState(false)
  const [showContentDialog, setShowContentDialog] = useState<"movie" | "cricket" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [starRating, setStarRating] = useState<number>(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isMobile = useMobile()

  const MAX_CHARS = 500
  const MAX_MEDIA = 4

  useEffect(() => {
    // Focus textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (newText.length <= MAX_CHARS) {
      setText(newText)
      setCharCount(newText.length)
    }
  }

  const handleMediaUpload = () => {
    if (media.length >= MAX_MEDIA) return
    setShowMediaDialog(true)
  }

  // Mock media upload function
  const addMedia = (type: string, url: string) => {
    if (media.length >= MAX_MEDIA) return

    setMedia((prev) => [...prev, { type, url }])
    setShowMediaDialog(false)
  }

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index))
  }

  // Mock content search function
  const handleSearch = (type: "movie" | "cricket") => {
    if (!searchQuery.trim()) return

    // Simulate API call
    setTimeout(() => {
      if (type === "movie") {
        setSearchResults(
          [
            { id: "m1", title: "Oppenheimer", posterUrl: "/oppenheimer-inspired-poster.png" },
            { id: "m2", title: "Dune: Part Two", posterUrl: "/dune-part-two-poster.png" },
            { id: "m3", title: "Poor Things", posterUrl: "/poor-things-poster.png" },
            { id: "m4", title: "Challengers", posterUrl: "/challengers-poster.png" },
            { id: "m5", title: "Civil War", posterUrl: "/civil-war-movie-poster.png" },
          ].filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      } else {
        setSearchResults(
          [
            { id: "c1", title: "India vs Australia - 2nd ODI", posterUrl: "/cricket/ind-aus-series.png" },
            { id: "c2", title: "IPL 2024: MI vs CSK", posterUrl: "/cricket/mumbai-indians-logo.png" },
            { id: "c3", title: "World Cup 2023 Highlights", posterUrl: "/cricket/world-cup-logo.png" },
            { id: "c4", title: "IPL 2024: RCB vs KKR", posterUrl: "/cricket/ipl-logo.png" },
          ].filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      }
    }, 300)
  }

  const selectContent = (item: any) => {
    if (!showContentDialog) return

    setLinkedContent({
      type: showContentDialog,
      id: item.id,
      title: item.title,
      posterUrl: item.posterUrl,
    })

    setShowContentDialog(null)
    setSearchQuery("")
    setSearchResults([])
  }

  const removeLinkedContent = () => {
    setLinkedContent(null)
  }

  const handleSubmit = () => {
    if (text.trim() === "" && media.length === 0 && !linkedContent) return

    setIsSubmitting(true)

    // Create new pulse object
    const newPulse: PulseType = {
      id: uuidv4(),
      userId: "current-user-id",
      userInfo: {
        username: "currentuser",
        displayName: "Current User",
        avatarUrl: "/user-avatar-1.png",
        isVerified: true,
        verificationLevel: "basic",
        isFollowing: false,
        role: selectedRole as any || null,
      },
      content: {
        text: text,
        media: media.length > 0 ? media : undefined,
        linkedContent: linkedContent || undefined,
        hashtags: extractHashtags(text),
        starRating: (selectedRole && linkedContent && starRating > 0) ? starRating : undefined,
      },
      engagement: {
        reactions: {
          love: 0,
          fire: 0,
          mindblown: 0,
          laugh: 0,
          sad: 0,
          angry: 0,
          total: 0,
        },
        comments: 0,
        shares: 0,
        hasCommented: false,
        hasShared: false,
        hasBookmarked: false,
      },
      timestamp: new Date().toISOString(),
    }

    // Simulate API call delay
    setTimeout(() => {
      onSubmit(newPulse)
      setIsSubmitting(false)
    }, 500)
  }

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g
    const matches = text.match(hashtagRegex)
    return matches ? matches : []
  }

  // Mock emoji insertion
  const insertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newText = text.substring(0, start) + emoji + text.substring(end)

      if (newText.length <= MAX_CHARS) {
        setText(newText)
        setCharCount(newText.length)

        // Reset cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + emoji.length
            textareaRef.current.selectionEnd = start + emoji.length
            textareaRef.current.focus()
          }
        }, 0)
      }
    }

    setShowEmojiPicker(false)
  }

  // Mock emoji picker
  const EmojiPicker = () => {
    const emojis = ["😀", "😂", "😍", "🔥", "👍", "🎬", "🏏", "🎭", "🌟", "🎉", "😮", "❤️", "👏", "🤔", "😎", "🙌"]

    return (
      <motion.div
        className="absolute bottom-full left-0 mb-2 bg-[#282828] rounded-lg p-2 border border-[#3A3A3A] z-10 w-64"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <div className="grid grid-cols-8 gap-1">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              className="w-7 h-7 flex items-center justify-center hover:bg-[#3A3A3A] rounded"
              onClick={() => insertEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </motion.div>
    )
  }

  // Mock media dialog
  const MediaDialog = () => {
    const mockMediaOptions = [
      { type: "image", url: "/dramatic-movie-scene.png", label: "Movie Scene" },
      { type: "image", url: "/cricket-match-celebration.png", label: "Cricket Match" },
      { type: "image", url: "/cinematic-scene.png", label: "Cinematic Shot" },
      { type: "image", url: "/placeholder-3131q.png", label: "Abstract Art" },
      { type: "video", url: "/dramatic-movie-scene.png", label: "Movie Clip" },
      { type: "video", url: "/cricket-match-celebration.png", label: "Cricket Highlight" },
    ]

    return (
      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent className="bg-[#282828] border-[#3A3A3A] text-white">
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {mockMediaOptions.map((item, index) => (
              <div key={index} className="relative cursor-pointer group" onClick={() => addMedia(item.type, item.url)}>
                <div className="aspect-video rounded-md overflow-hidden">
                  <img
                    src={item.url || "/placeholder.svg"}
                    alt={item.label}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70">
                    <Plus className="h-4 w-4 mr-1" />
                    Select
                  </Button>
                </div>
                <p className="text-xs mt-1 text-[#A0A0A0]">{item.label}</p>
                {item.type === "video" && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Video</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setShowMediaDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Content search dialog
  const ContentSearchDialog = () => {
    if (!showContentDialog) return null

    return (
      <Dialog open={!!showContentDialog} onOpenChange={() => setShowContentDialog(null)}>
        <DialogContent className="bg-[#282828] border-[#3A3A3A] text-white">
          <DialogHeader>
            <DialogTitle>{showContentDialog === "movie" ? "Link a Movie" : "Link a Cricket Match"}</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex gap-2">
              <Input
                placeholder={`Search for a ${showContentDialog === "movie" ? "movie" : "cricket match"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1A1A1A] border-[#3A3A3A] text-white"
              />
              <Button
                variant="secondary"
                onClick={() => handleSearch(showContentDialog)}
                className="bg-[#3A3A3A] hover:bg-[#4A4A4A]"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 max-h-60 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-center py-4 text-[#A0A0A0]">
                  {searchQuery ? "No results found" : "Search for content to link"}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 hover:bg-[#3A3A3A] rounded-md cursor-pointer"
                      onClick={() => selectContent(item)}
                    >
                      <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={item.posterUrl || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-[#A0A0A0]">
                          {showContentDialog === "movie" ? "Movie" : "Cricket Match"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <motion.div
        className="bg-[#282828] rounded-lg p-4 mb-6 border border-[#3A3A3A]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create Pulse</h3>
          <div className="flex items-center gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[140px] h-8 bg-[#1A1A1A] border-[#3A3A3A] text-xs">
                <SelectValue placeholder="Post as..." />
              </SelectTrigger>
              <SelectContent className="bg-[#282828] border-[#3A3A3A] text-white">
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="critic">As Critic 🎬</SelectItem>
                <SelectItem value="industry_pro">As Filmmaker 🎥</SelectItem>
                <SelectItem value="talent_pro">As Talent 🌟</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-[#A0A0A0] hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img src="/user-avatar-1.png" alt="Your profile" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="What's happening in the entertainment world?"
              value={text}
              onChange={handleTextChange}
              className="min-h-[100px] bg-[#1A1A1A] border-[#3A3A3A] focus:border-[#00BFFF] resize-none"
            />

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {media.map((item, index) => (
                  <div key={index} className="relative rounded-md overflow-hidden">
                    <img
                      src={item.url || "/placeholder.svg"}
                      alt={`Uploaded media ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 rounded-full w-6 h-6"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {item.type === "video" && (
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Video
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Linked Content Preview */}
            {linkedContent && (
              <div className="mt-3 bg-[#1A1A1A] rounded-md overflow-hidden border border-[#3A3A3A] relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 rounded-full w-6 h-6 z-10"
                  onClick={removeLinkedContent}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="flex">
                  {linkedContent.posterUrl && (
                    <div className="w-20 h-20 flex-shrink-0">
                      <img
                        src={linkedContent.posterUrl || "/placeholder.svg"}
                        alt={linkedContent.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="text-xs text-[#00BFFF] uppercase mb-1">
                      {linkedContent.type === "movie" ? "Movie" : "Cricket Match"}
                    </div>
                    <div className="font-medium">{linkedContent.title}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Star Rating Input */}
            {linkedContent && selectedRole && selectedRole !== "personal" && (
              <div className="mt-3 bg-[#1A1A1A] rounded-md p-3 border border-[#3A3A3A] flex items-center justify-between">
                <span className="text-sm text-[#A0A0A0]">Rate this title:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setStarRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= starRating ? "text-yellow-500 fill-yellow-500" : "text-[#3A3A3A]"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-3">
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#A0A0A0] hover:text-[#00BFFF]"
                        onClick={handleMediaUpload}
                        disabled={media.length >= MAX_MEDIA}
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add image{media.length >= MAX_MEDIA ? " (max 4)" : ""}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#A0A0A0] hover:text-[#00BFFF]"
                        onClick={() => setShowContentDialog("movie")}
                        disabled={!!linkedContent}
                      >
                        <MovieIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Link a movie</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#A0A0A0] hover:text-[#00BFFF]"
                        onClick={() => setShowContentDialog("cricket")}
                        disabled={!!linkedContent}
                      >
                        <Cricket className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Link a cricket match</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="relative">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#A0A0A0] hover:text-[#00BFFF]"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          <Smile className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add emoji</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <AnimatePresence>{showEmojiPicker && <EmojiPicker />}</AnimatePresence>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#A0A0A0] hover:text-[#00BFFF]"
                        onClick={() => {
                          if (textareaRef.current) {
                            const start = textareaRef.current.selectionStart
                            const newText = text.substring(0, start) + "#" + text.substring(start)
                            if (newText.length <= MAX_CHARS) {
                              setText(newText)
                              setCharCount(newText.length)
                              // Set cursor position after the #
                              setTimeout(() => {
                                if (textareaRef.current) {
                                  textareaRef.current.selectionStart = start + 1
                                  textareaRef.current.selectionEnd = start + 1
                                  textareaRef.current.focus()
                                }
                              }, 0)
                            }
                          }
                        }}
                      >
                        <Hash className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add hashtag</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-[#A0A0A0] hover:text-[#00BFFF]">
                        <Link2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add link</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-sm ${charCount > MAX_CHARS * 0.8 ? "text-orange-400" : "text-[#A0A0A0]"}`}>
                  {charCount}/{MAX_CHARS}
                </span>

                <Button
                  className="bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-black"
                  disabled={isSubmitting || (text.trim() === "" && media.length === 0 && !linkedContent)}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                      Posting...
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialogs */}
      <MediaDialog />
      <ContentSearchDialog />
    </>
  )
}
