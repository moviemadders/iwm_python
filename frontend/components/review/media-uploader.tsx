"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, Sparkles } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface MediaUploaderProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  onOpenGifPicker?: () => void
}

export function MediaUploader({ files, onFilesChange, onOpenGifPicker }: MediaUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, 2)
      onFilesChange(newFiles)

      // Create previews
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
      setPreviews(newPreviews)
    },
    [files, onFilesChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
      "image/gif": [".gif"],
    },
    maxFiles: 2,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)

    URL.revokeObjectURL(previews[index])
    setPreviews(previews.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-siddu-text-light">Add Media (Optional)</label>

      {/* GIF Picker Button - MOVED TO TOP */}
      {onOpenGifPicker && (
        <button
          type="button"
          onClick={onOpenGifPicker}
          className="w-full py-3 px-4 border-2 border-siddu-electric-blue rounded-lg hover:bg-siddu-electric-blue/10 transition-all flex items-center justify-center gap-2 text-siddu-electric-blue font-semibold"
        >
          <Sparkles className="w-5 h-5" />
          <span>Search GIFs</span>
        </button>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? "border-siddu-electric-blue bg-siddu-electric-blue/10"
            : "border-siddu-border-subtle hover:border-siddu-electric-blue/50"
          }
        `}
      >
        <input {...getInputProps()} />

        {files.length === 0 ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-siddu-text-subtle" />
            <p className="text-siddu-text-light">Add images to your review</p>
            <p className="text-sm text-siddu-text-subtle">Drag & drop or click to browse</p>
            <p className="text-xs text-siddu-text-subtle">JPG, PNG • Max 2 files • 5MB per image</p>
          </div>
        ) : (
          <div className="flex gap-4 justify-center flex-wrap">
            <AnimatePresence>
              {previews.map((preview, index) => (
                <motion.div
                  key={preview}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`Upload ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {files.length < 2 && (
              <div className="w-24 h-24 border-2 border-dashed border-siddu-border-subtle rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-siddu-text-subtle" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
