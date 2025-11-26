'use client'

/**
 * Media Upload Button Component
 * Mock file upload button (no actual file handling)
 */

import { useRef, useState } from 'react'
import { Image, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PulseMedia } from '@/types/pulse'
import { pulseApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface MediaUploadButtonProps {
  onMediaAdd: (media: PulseMedia[]) => void
  disabled?: boolean
}

export default function MediaUploadButton({
  onMediaAdd,
  disabled = false,
}: MediaUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleClick = () => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newMedia: PulseMedia[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Basic validation
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive"
          })
          continue
        }

        try {
          const response = await pulseApi.uploadMedia(file)

          newMedia.push({
            id: response.filename || `media-${Date.now()}-${i}`,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            url: response.url,
            thumbnail_url: response.url, // Cloudinary can generate thumbnails, but using original for now
            width: 0, // We don't get dimensions back immediately unless we parse response better
            height: 0,
            alt_text: file.name
          })
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          })
        }
      }

      if (newMedia.length > 0) {
        onMediaAdd(newMedia)
      }
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
        multiple
      />
      <motion.button
        onClick={handleClick}
        disabled={disabled || isUploading}
        whileHover={{ scale: disabled || isUploading ? 1 : 1.1 }}
        whileTap={{ scale: disabled || isUploading ? 1 : 0.95 }}
        className={`p-2 rounded-lg transition-colors ${disabled || isUploading
            ? 'text-[#3A3A3A] cursor-not-allowed'
            : 'text-[#00BFFF] hover:bg-[#00BFFF]/10'
          }`}
        title="Add media"
      >
        {isUploading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Image size={20} />
        )}
      </motion.button>
    </>
  )
}

