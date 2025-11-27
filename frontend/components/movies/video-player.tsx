
"use client"

import React, { useEffect, useRef } from "react"
import videojs from "video.js"
import "video.js/dist/video-js.css"
import "videojs-youtube"

interface VideoPlayerProps {
  options: any
  onReady?: (player: any) => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  onPause?: (currentTime: number, duration: number) => void
  onPlay?: () => void
}

import { Sun, Volume2 } from "lucide-react"

export const VideoPlayer = (props: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [brightness, setBrightness] = React.useState(1)
  const [volume, setVolume] = React.useState(1)
  const [showVolume, setShowVolume] = React.useState(false)
  const [showBrightness, setShowBrightness] = React.useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { options, onReady } = props

  // Helper to show indicator
  const showIndicator = (type: 'volume' | 'brightness') => {
    if (type === 'volume') {
        setShowVolume(true)
        setShowBrightness(false)
    } else {
        setShowBrightness(true)
        setShowVolume(false)
    }
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
        setShowVolume(false)
        setShowBrightness(false)
    }, 1500)
  }

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js")

      videoElement.classList.add("vjs-big-play-centered")
      videoElement.classList.add("vjs-movie-madders") 
      videoRef.current?.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, options, () => {
        onReady && onReady(player)
        setVolume(player.volume() || 1) // Init volume state
      }))

      // Auto Fullscreen on Play
      player.on("play", () => {
        if (!player.isFullscreen()) {
            player.requestFullscreen().catch(() => {})
        }
        if (props.onPlay) props.onPlay()
      })
      
      player.on("volumechange", () => {
         setVolume(player.volume() || 1)
      })

      // Event listeners
      player.on("timeupdate", () => {
        if (props.onTimeUpdate) {
            const currentTime = player.currentTime() || 0
            const duration = player.duration() || 0
            props.onTimeUpdate(currentTime, duration)
        }
      })

      player.on("ended", () => {
        if (props.onEnded) props.onEnded()
      })

      player.on("pause", () => {
        if (props.onPause) {
            const currentTime = player.currentTime() || 0
            const duration = player.duration() || 0
            props.onPause(currentTime, duration)
        }
      })

    } else {
      const player = playerRef.current
      player.autoplay(options.autoplay)
      player.src(options.sources)
    }
  }, [options, videoRef])

  // Mobile Gestures
  useEffect(() => {
    const element = videoRef.current
    if (!element) return

    let touchStartY = 0
    let touchStartX = 0
    
    const handleTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0].clientY
        touchStartX = e.touches[0].clientX
    }

    const handleTouchMove = (e: TouchEvent) => {
        // Don't prevent default immediately to allow some scrolling if needed, 
        // but for a player we usually want to prevent it.
        if (e.cancelable) e.preventDefault()
        
        if (!playerRef.current) return

        const touchEndY = e.touches[0].clientY
        const touchEndX = e.touches[0].clientX
        const deltaY = touchStartY - touchEndY
        const deltaX = touchStartX - touchEndX
        
        // Threshold
        if (Math.abs(deltaY) < 5 && Math.abs(deltaX) < 5) return

        const { width, height } = element.getBoundingClientRect()
        
        // Vertical Swipe
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // Right side: Volume
            if (touchStartX > width / 2) {
                const currentVol = playerRef.current.volume()
                const sensitivity = 0.01 // Adjust sensitivity
                const newVol = Math.min(1, Math.max(0, currentVol + (deltaY * sensitivity)))
                playerRef.current.volume(newVol)
                setVolume(newVol)
                showIndicator('volume')
            } 
            // Left side: Brightness
            else {
                 const sensitivity = 0.01
                 setBrightness(prev => {
                    const newVal = Math.min(1, Math.max(0.2, prev + (deltaY * sensitivity)))
                    showIndicator('brightness')
                    return newVal
                 })
            }
        }
        
        // Reset start for continuous movement (optional, or keep generic delta)
        // For smooth sliding, we might want to keep start and use total delta, 
        // but updating start allows relative movement.
        // Let's keep start fixed? No, updating is better for "dragging" feel.
        // Actually, for "swipe", updating start is standard for "drag" behavior.
        // But touchmove fires rapidly.
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // Dispose the player on unmount
  useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return (
    <div data-vjs-player className="w-full h-full relative group">
      <div ref={videoRef} className="w-full h-full" />
      
      {/* Brightness Overlay - z-index 1 to be above video but below controls (z-index 100) */}
      <div 
        className="absolute inset-0 bg-black pointer-events-none z-[1] transition-opacity duration-100" 
        style={{ opacity: 1 - brightness }} 
      />

      {/* Volume Indicator */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none z-[200] ${showVolume ? 'opacity-100' : 'opacity-0'}`}>
        <Volume2 className="w-12 h-12 text-white mb-4" />
        <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${volume * 100}%` }} />
        </div>
        <span className="text-white font-medium mt-2">{Math.round(volume * 100)}%</span>
      </div>

      {/* Brightness Indicator */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none z-[200] ${showBrightness ? 'opacity-100' : 'opacity-0'}`}>
        <Sun className="w-12 h-12 text-white mb-4" />
        <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 transition-all duration-100" style={{ width: `${brightness * 100}%` }} />
        </div>
        <span className="text-white font-medium mt-2">{Math.round(brightness * 100)}%</span>
      </div>
    </div>
  )
}
