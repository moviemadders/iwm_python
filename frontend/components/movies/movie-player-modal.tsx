"use client"

import React, { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { getApiUrl } from "@/lib/api-config"
import { getCurrentUser, getAccessToken } from "@/lib/auth"
import { VideoPlayer } from "./video-player"
import { MovieMaddersIntro } from "./movie-madders-intro"
import { useWatchHistory } from "@/hooks/useWatchHistory"

interface MoviePlayerModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  videoSource: "youtube" | "direct" | "external"
  movieId: string
  title: string
  initialProgress?: number // in seconds
  totalDuration?: number // in seconds
}

export function MoviePlayerModal({
  isOpen,
  onClose,
  videoUrl,
  videoSource,
  movieId,
  title,
  initialProgress = 0,
  totalDuration = 0,
}: MoviePlayerModalProps) {
  const playerRef = useRef<any>(null)
  const [progress, setProgress] = useState(initialProgress)
  const [duration, setDuration] = useState(totalDuration)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showIntro, setShowIntro] = useState(initialProgress === 0) // Only show intro if starting from beginning
  const [userId, setUserId] = useState<string | null>(null)
  const { mutate: mutateHistory } = useWatchHistory(userId || "")

  useEffect(() => {
    getCurrentUser().then(user => {
        if (user) setUserId(user.id)
    })
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Reset intro state when opening new movie
  useEffect(() => {
    if (isOpen) {
        setShowIntro(initialProgress < 5) // Show intro if starting near the beginning
    }
  }, [isOpen, initialProgress])

  // Update progress to backend
  const updateProgress = async (currentSeconds: number, totalSeconds: number, status: "playing" | "paused" | "ended") => {
    try {
      const apiBase = getApiUrl()
      const user = await getCurrentUser()
      if (!user || !apiBase) return

      await fetch(`${apiBase}/api/v1/movies/${movieId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          progress_seconds: Math.floor(currentSeconds),
          total_duration_seconds: Math.floor(totalSeconds),
          status,
        }),
      })
    } catch (error) {
      console.error("Failed to update progress:", error)
    }
  }

  const handlePlayerReady = (player: any) => {
    playerRef.current = player
    
    // Seek to initial progress if needed
    if (initialProgress > 0) {
      player.currentTime(initialProgress)
    }
  }

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    setProgress(currentTime)
    setDuration(duration)
    
    // Update backend every 15 seconds
    if (Math.floor(currentTime) % 15 === 0) {
       updateProgress(currentTime, duration, "playing")
    }
  }

  const handlePause = (currentTime: number, duration: number) => {
    setIsPlaying(false)
    updateProgress(currentTime, duration, "paused")
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (playerRef.current) {
        updateProgress(playerRef.current.currentTime(), playerRef.current.duration(), "ended")
        mutateHistory()
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleIntroComplete = () => {
    setShowIntro(false)
    if (playerRef.current) {
        playerRef.current.play()
    }
  }

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [{
      src: videoUrl,
      type: videoSource === "youtube" ? "video/youtube" : "video/mp4"
    }],
    techOrder: ["youtube", "html5"],
    youtube: {
        ytControls: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-none !w-screen !h-screen !p-0 !m-0 !border-0 !rounded-none flex flex-col bg-black">
        {showIntro ? (
            <MovieMaddersIntro onComplete={handleIntroComplete} />
        ) : (
        <div className="relative w-full h-full bg-black flex items-center justify-center group">
            <DialogTitle className="sr-only">{title}</DialogTitle>
          
          {/* Header Overlay (fades out) */}
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
             <h2 className="text-white text-xl font-semibold tracking-wide">{title}</h2>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-3 bg-black/40 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 opacity-0"
            aria-label="Close player"
          >
            <X className="w-8 h-8 text-white" />
          </button>

          <div className="w-full h-full">
            <VideoPlayer 
                options={videoJsOptions} 
                onReady={handlePlayerReady}
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePause}
                onEnded={handleEnded}
                onPlay={handlePlay}
            />
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
