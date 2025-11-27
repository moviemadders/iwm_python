"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface MovieMaddersIntroProps {
  onComplete: () => void
}

export function MovieMaddersIntro({ onComplete }: MovieMaddersIntroProps) {
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 4000) // 4 seconds total duration

    const textTimer = setTimeout(() => {
      setShowText(true)
    }, 800)

    return () => {
      clearTimeout(timer)
      clearTimeout(textTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-4xl aspect-video flex flex-col items-center justify-center">
        {/* The "M" Animation */}
        <motion.div
          initial={{ scale: 5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M10 110V10L40 110L70 10L100 110V10"
              stroke="#E50914"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
            />
          </svg>
        </motion.div>

        {/* Text Reveal */}
        {showText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase" 
                style={{ textShadow: "0 0 20px rgba(229, 9, 20, 0.5)" }}>
              MOVIE <span className="text-[#E50914]">MADDERS</span>
            </h1>
          </motion.div>
        )}
      </div>
      
      {/* Skip Button */}
      <button 
        onClick={onComplete}
        className="absolute bottom-10 right-10 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 backdrop-blur-sm transition-colors text-sm font-medium uppercase tracking-wider z-50"
      >
        Skip Intro
      </button>
    </div>
  )
}
