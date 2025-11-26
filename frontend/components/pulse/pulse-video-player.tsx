"use client"

import { useState, useRef, useEffect } from "react"
import { useInView } from "framer-motion"

interface PulseVideoPlayerProps {
  src: string
  poster?: string
  className?: string
}

export default function PulseVideoPlayer({ src, poster, className }: PulseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { amount: 0.5 })
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (isInView) {
      // Auto-play when in view (muted)
      videoRef.current?.play().catch(() => {
        // Autoplay might be blocked
      })
      setIsPlaying(true)
    } else {
      // Pause when out of view
      videoRef.current?.pause()
      setIsPlaying(false)
    }
  }, [isInView])

  return (
    <div ref={containerRef} className={`relative bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        controls
        playsInline
        muted // Muted required for autoplay
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  )
}
