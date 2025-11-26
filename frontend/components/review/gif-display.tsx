"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"

interface GifDisplayProps {
    gifUrl: string
    onRemove: () => void
    className?: string
}

export function GifDisplay({ gifUrl, onRemove, className = "" }: GifDisplayProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative group ${className}`}
        >
            <div className="relative rounded-lg overflow-hidden bg-siddu-bg-subtle border border-siddu-border-subtle min-h-[200px] flex items-center justify-center">
                <img
                    src={gifUrl}
                    alt="Selected GIF"
                    className="w-full h-auto max-h-80 object-contain"
                    onError={(e) => {
                        console.error("Error loading GIF:", gifUrl)
                        e.currentTarget.style.display = 'none'
                    }}
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-100 shadow-lg transition-transform hover:scale-110 z-10"
                    aria-label="Remove GIF"
                    title="Remove GIF"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <p className="text-xs text-siddu-text-subtle mt-2 text-center">
                Your selected GIF will appear at the top of your review
            </p>
        </motion.div>
    )
}
