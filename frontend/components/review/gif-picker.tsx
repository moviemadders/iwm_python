"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Sparkles, TrendingUp } from "lucide-react"
import { searchGifs, getTrendingGifs, getGifCategories, type TenorGif, registerGifShare } from "@/lib/api/tenor"
import { useDebounce } from "@/hooks/use-debounce"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GifPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelectGif: (gifUrl: string) => void
}

export function GifPicker({ isOpen, onClose, onSelectGif }: GifPickerProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [gifs, setGifs] = useState<TenorGif[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const debouncedSearch = useDebounce(searchQuery, 500)

    // Load trending GIFs on mount
    useEffect(() => {
        if (isOpen && !searchQuery && !selectedCategory) {
            loadTrendingGifs()
        }
    }, [isOpen])

    // Load categories
    useEffect(() => {
        if (isOpen) {
            getGifCategories().then(setCategories)
        }
    }, [isOpen])

    // Search when query changes
    useEffect(() => {
        if (debouncedSearch) {
            searchForGifs(debouncedSearch)
        } else if (!selectedCategory) {
            loadTrendingGifs()
        }
    }, [debouncedSearch])

    const loadTrendingGifs = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await getTrendingGifs(30)
            setGifs(response.results)
        } catch (err) {
            setError("Failed to load trending GIFs")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const searchForGifs = async (query: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await searchGifs(query, 30)
            setGifs(response.results)
        } catch (err) {
            setError("Failed to search GIFs")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category)
        setSearchQuery(category)
        searchForGifs(category)
    }

    const handleGifSelect = async (gif: TenorGif) => {
        // Register the share with Tenor for analytics
        try {
            await registerGifShare(gif.id)
        } catch (err) {
            console.error("Failed to register GIF share:", err)
        }

        // Use medium GIF for better quality, fallback to standard GIF
        const gifUrl = gif.media_formats.mediumgif?.url || gif.media_formats.gif.url
        console.log("Selected GIF URL:", gifUrl)
        onSelectGif(gifUrl)
        onClose()
    }

    const handleClose = () => {
        setSearchQuery("")
        setSelectedCategory(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] bg-siddu-bg-card border-siddu-border-subtle">
                <DialogHeader>
                    <DialogTitle className="text-siddu-text-light flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-siddu-electric-blue" />
                        Choose a GIF
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-siddu-text-subtle" />
                        <Input
                            type="text"
                            placeholder="Search for GIFs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-siddu-bg-subtle border-siddu-border-subtle text-siddu-text-light"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery("")
                                    setSelectedCategory(null)
                                    loadTrendingGifs()
                                }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                                <X className="w-4 h-4 text-siddu-text-subtle hover:text-siddu-text-light" />
                            </button>
                        )}
                    </div>

                    {/* Categories */}
                    {!searchQuery && (
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadTrendingGifs}
                                className="text-xs border-siddu-border-subtle hover:border-siddu-electric-blue"
                            >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                            </Button>
                            {categories.slice(0, 10).map((category) => (
                                <Button
                                    key={category}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCategoryClick(category)}
                                    className={`text-xs border-siddu-border-subtle hover:border-siddu-electric-blue ${selectedCategory === category ? "border-siddu-electric-blue bg-siddu-electric-blue/10" : ""
                                        }`}
                                >
                                    {category}
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* GIF Grid */}
                    <ScrollArea className="h-[400px]">
                        {error && (
                            <div className="text-center py-8 text-red-400">
                                {error}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="grid grid-cols-3 gap-2">
                                {[...Array(9)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="aspect-square bg-siddu-bg-subtle animate-pulse rounded-lg"
                                    />
                                ))}
                            </div>
                        ) : gifs.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                <AnimatePresence>
                                    {gifs.map((gif) => (
                                        <motion.button
                                            key={gif.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleGifSelect(gif)}
                                            className="relative aspect-square rounded-lg overflow-hidden bg-siddu-bg-subtle hover:ring-2 hover:ring-siddu-electric-blue transition-all"
                                        >
                                            <img
                                                src={gif.media_formats.tinygif?.url || gif.media_formats.gif.url}
                                                alt={gif.content_description || gif.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-siddu-text-subtle">
                                No GIFs found. Try a different search term.
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer */}
                    <div className="flex justify-between items-center text-xs text-siddu-text-subtle">
                        <span>Powered by Tenor</span>
                        <Button variant="ghost" size="sm" onClick={handleClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
