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
            <div className="relative rounded-lg overflow-hidden bg-siddu-bg-subtle border border-siddu-border-subtle">
                <img
                    src={gifUrl}
                    alt="Selected GIF"
                    className="w-full max-h-64 object-contain"
                />
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    aria-label="Remove GIF"
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
