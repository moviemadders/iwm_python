"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Plus, Check } from "lucide-react"
import type { UserCollection } from "@/types/profile"
import { getUserCollections, addMovieToCollection, removeMovieFromCollection, createCollection } from "@/lib/api/collections"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

interface AddToCollectionModalProps {
  movieId: string
  movieTitle: string
  onClose: () => void
}

export function AddToCollectionModal({
  movieId,
  movieTitle,
  onClose,
}: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<UserCollection[]>([])
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  const [initialCollections, setInitialCollections] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionDescription, setNewCollectionDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const { trigger } = useHaptic()

  useEffect(() => {
    const loadCollections = async () => {
      setIsLoading(true)
      try {
        const { getCurrentUser } = await import("@/lib/auth")
        const current = await getCurrentUser()

        if (!current) {
          toast({
            title: "Login Required",
            description: "Please log in to manage collections.",
            variant: "destructive",
          })
          setTimeout(() => {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          }, 1500)
          return
        }

        const data = await getUserCollections(current.id)
        const collectionsArray = Array.isArray(data) ? data : []
        setCollections(collectionsArray)

        // Pre-select collections that already contain this movie
        const alreadyIn = collectionsArray
          .filter((c: any) => c.movies?.some((m: any) => m.id === movieId || m.external_id === movieId))
          .map((c: any) => c.id || c.external_id)
        setSelectedCollections(new Set(alreadyIn))
        setInitialCollections(new Set(alreadyIn))
      } catch (error: any) {
        console.error("Failed to load collections:", error)
        const errorMessage = error.message || "Failed to load collections. Please try again."

        // Check if it's an authentication error
        if (errorMessage.includes("log in") || errorMessage.includes("Unauthorized")) {
          toast({
            title: "Login Required",
            description: "Please log in to manage collections.",
            variant: "destructive",
          })
          setTimeout(() => {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          }, 1500)
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCollections()
  }, [movieId, toast])

  const toggleCollection = (collectionId: string) => {
    trigger("light")
    setSelectedCollections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId)
      } else {
        newSet.add(collectionId)
      }
      return newSet
    })
  }

  const handleCreateCollection = async () => {
    trigger("medium")
    if (!newCollectionName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a collection name.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const { getCurrentUser } = await import("@/lib/auth")
      const current = await getCurrentUser()

      if (!current) {
        toast({
          title: "Login Required",
          description: "Please log in to create collections.",
          variant: "destructive",
        })
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        }, 1500)
        return
      }

      const newCollection = await createCollection({
        title: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
        isPublic: false,
      })

      // Add the new collection to the list
      setCollections(prev => [...prev, newCollection])

      // Automatically select the new collection and add the movie to it
      setSelectedCollections(prev => new Set([...prev, newCollection.id]))

      // Add movie to the new collection immediately
      await addMovieToCollection(newCollection.id, movieId)

      toast({
        title: "Collection Created",
        description: `"${newCollectionName}" created and ${movieTitle} added successfully.`,
      })

      // Reset form
      setNewCollectionName("")
      setNewCollectionDescription("")
      setShowCreateForm(false)
      trigger("success")
    } catch (error: any) {
      trigger("error")
      console.error("Failed to create collection:", error)
      const errorMessage = error.message || "Failed to create collection. Please try again."

      if (errorMessage.includes("log in") || errorMessage.includes("Unauthorized")) {
        toast({
          title: "Login Required",
          description: "Please log in to create collections.",
          variant: "destructive",
        })
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        }, 1500)
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    trigger("medium")

    try {
      // Determine which collections to add to and remove from
      const toAdd = Array.from(selectedCollections).filter(id => !initialCollections.has(id))
      const toRemove = Array.from(initialCollections).filter(id => !selectedCollections.has(id))

      // Add movie to new collections
      for (const collectionId of toAdd) {
        await addMovieToCollection(collectionId, movieId)
      }

      // Remove movie from deselected collections
      for (const collectionId of toRemove) {
        await removeMovieFromCollection(collectionId, movieId)
      }

      toast({
        title: "Success",
        description: `${movieTitle} has been updated in your collections.`,
      })
      trigger("success")

      onClose()
    } catch (error) {
      trigger("error")
      console.error("Failed to update collections:", error)
      toast({
        title: "Error",
        description: "Failed to update collections. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="glass-panel w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl border border-white/10 shadow-[0_0_50px_-10px_rgba(0,240,255,0.1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-inter font-bold text-white tracking-tight">
                Add to Collection
              </h2>
              <p className="text-sm text-gray-400 font-dmsans mt-1">
                {movieTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Collections List */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-white/10 border-t-[var(--primary)] rounded-full animate-spin shadow-[0_0_15px_var(--primary)]" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Create New Collection Button/Form */}
                {!showCreateForm ? (
                  <button
                    onClick={() => {
                        setShowCreateForm(true)
                        trigger("light")
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/20 hover:border-[var(--primary)]/50 text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all group"
                  >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    <span className="font-dmsans font-medium">Create New Collection</span>
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-dmsans text-gray-300 mb-2">
                        Collection Name *
                      </label>
                      <Input
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="e.g., My Favorite Sci-Fi"
                        className="bg-black/50 border-white/10 text-white focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                        disabled={isCreating}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-dmsans text-gray-300 mb-2">
                        Description (Optional)
                      </label>
                      <Textarea
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                        placeholder="Describe your collection..."
                        className="bg-black/50 border-white/10 text-white min-h-[80px] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                        disabled={isCreating}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCreateCollection}
                        disabled={isCreating || !newCollectionName.trim()}
                        className="flex-1 px-4 py-2 bg-[var(--primary)] text-black font-bold font-inter rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_-5px_var(--primary)]"
                      >
                        {isCreating ? "Creating..." : "Create & Add"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false)
                          setNewCollectionName("")
                          setNewCollectionDescription("")
                          trigger("light")
                        }}
                        disabled={isCreating}
                        className="px-4 py-2 border border-white/10 text-gray-300 font-inter font-medium rounded-lg hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Existing Collections */}
                {collections.length === 0 && !showCreateForm ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-dmsans">
                      You don't have any collections yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collections.map(collection => (
                      <motion.button
                        key={collection.id}
                        onClick={() => toggleCollection(collection.id)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group",
                            selectedCollections.has(collection.id)
                                ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-[0_0_15px_-5px_var(--primary)]"
                                : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        )}
                      >
                        <div className="flex-1 text-left">
                          <h3 className={cn(
                              "font-dmsans font-medium transition-colors",
                              selectedCollections.has(collection.id) ? "text-white" : "text-gray-300 group-hover:text-white"
                          )}>
                            {collection.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {collection.movieCount} {collection.movieCount === 1 ? "movie" : "movies"}
                          </p>
                        </div>
                        <div
                          className={cn(
                              "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300",
                              selectedCollections.has(collection.id)
                                ? "border-[var(--primary)] bg-[var(--primary)] text-black"
                                : "border-white/20 group-hover:border-white/40"
                          )}
                        >
                          {selectedCollections.has(collection.id) && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20">
            <p className="text-sm text-gray-500 font-dmsans">
              {selectedCollections.size} {selectedCollections.size === 1 ? "collection" : "collections"} selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-2.5 border border-white/10 text-gray-300 font-inter font-medium rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[var(--primary)] text-black font-bold font-inter rounded-xl hover:bg-[var(--primary)]/90 transition-all duration-200 hover:scale-105 shadow-[0_0_20px_-5px_var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
