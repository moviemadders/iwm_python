'use client'

/**
 * Simple Comment Input Component for Pulses
 * Text-only with emoji support
 */

import { useState } from 'react'
import { Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import EmojiPickerButton from '../composer/emoji-picker-button'

interface CommentInputProps {
    onSubmit: (content: string) => Promise<void>
    isSubmitting?: boolean
}

export default function CommentInput({ onSubmit, isSubmitting = false }: CommentInputProps) {
    const [content, setContent] = useState('')
    const MAX_LENGTH = 500

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return

        await onSubmit(content.trim())
        setContent('')
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleEmojiSelect = (emoji: string) => {
        setContent((prev) => prev + emoji)
    }

    const isOverLimit = content.length > MAX_LENGTH
    const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting

    return (
        <div className="flex gap-2 items-start">
            <div className="flex-1 relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Add a comment..."
                    className="w-full bg-[#1A1A1A] text-[#E0E0E0] rounded-lg p-3 pr-12 resize-none border border-[#3A3A3A] focus:border-[#00BFFF] focus:outline-none"
                    rows={2}
                    maxLength={MAX_LENGTH + 50}
                    disabled={isSubmitting}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />
                    <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-[#A0A0A0]'}`}>
                        {content.length}/{MAX_LENGTH}
                    </span>
                </div>
            </div>
            <motion.button
                whileHover={{ scale: canSubmit ? 1.05 : 1 }}
                whileTap={{ scale: canSubmit ? 0.95 : 1 }}
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`p-3 rounded-lg transition-colors ${canSubmit
                        ? 'bg-[#00BFFF] text-white hover:bg-[#0099CC]'
                        : 'bg-[#3A3A3A] text-[#666] cursor-not-allowed'
                    }`}
            >
                <Send size={18} />
            </motion.button>
        </div>
    )
}
