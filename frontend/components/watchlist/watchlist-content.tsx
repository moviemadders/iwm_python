"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { WatchlistHeader } from "./watchlist-header"
import { WatchlistGrid } from "./watchlist-grid"
import { WatchlistEmptyState } from "./watchlist-empty-state"
import { getUserWatchlist, updateWatchlistItem, removeFromWatchlist } from "@/lib/api/watchlist"
import { getCurrentUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import type { WatchlistItem, WatchStatus, GroupByOption } from "./types"

export function WatchlistContent() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")
  const [groupBy, setGroupBy] = useState<GroupByOption | null>(null)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const { toast } = useToast()

  const fetchWatchlist = async () => {
    setIsLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) {
        // Handle unauthenticated state if needed, or just show empty
        setItems([])
        return
      }

      const data = await getUserWatchlist(user.id)
      // Backend returns a list of items directly or { items: [...] } depending on pagination
      // The repository list() returns List[dict], so it should be an array.
      // However, let's be safe.
      const watchlistItems = Array.isArray(data) ? data : data.items || []
      setItems(watchlistItems)
    } catch (error) {
      console.error("Failed to fetch watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to load watchlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
  }

  const handleUpdateStatus = async (itemId: string, newStatus: WatchStatus) => {
    try {
      // Optimistic update
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)))

      await updateWatchlistItem(itemId, { status: newStatus })

      toast({
        title: "Status Updated",
        description: `Movie marked as ${newStatus.replace("-", " ")}`,
      })
    } catch (error) {
      console.error("Failed to update status:", error)
      // Revert on error
      fetchWatchlist()
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePriority = async (itemId: string, newPriority: "high" | "medium" | "low") => {
    try {
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, priority: newPriority } : item)))
      await updateWatchlistItem(itemId, { priority: newPriority })
    } catch (error) {
      console.error("Failed to update priority:", error)
      fetchWatchlist()
    }
  }

  const handleUpdateProgress = async (itemId: string, newProgress: number) => {
    try {
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, progress: newProgress } : item)))
      await updateWatchlistItem(itemId, { progress: newProgress })
    } catch (error) {
      console.error("Failed to update progress:", error)
      fetchWatchlist()
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      setItems((prev) => prev.filter((item) => item.id !== itemId))
      await removeFromWatchlist(itemId)
      toast({
        title: "Removed from Watchlist",
        description: "Movie has been removed from your watchlist",
      })
    } catch (error) {
      console.error("Failed to remove item:", error)
      fetchWatchlist()
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    }
  }

  const handleToggleSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  // Filter items based on active filter
  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true
    return item.status === activeFilter
  })

  return (
    <motion.div
      className="min-h-screen bg-[#1A1A1A] text-white pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <WatchlistHeader
        activeStatus={activeFilter as WatchStatus | "all"}
        onStatusChange={(status) => handleFilterChange(status)}
        itemCount={filteredItems.length}
        onGroupByChange={setGroupBy}
        isBatchMode={isBatchMode}
        onToggleBatchMode={() => setIsBatchMode(!isBatchMode)}
      />

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00BFFF]"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <WatchlistGrid
            items={filteredItems}
            groupBy={groupBy}
            isBatchMode={isBatchMode}
            selectedItems={selectedItems}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            onUpdateProgress={handleUpdateProgress}
            onRemoveItem={handleRemoveItem}
            onToggleSelection={handleToggleSelection}
          />
        ) : (
          <WatchlistEmptyState activeStatus={activeFilter as WatchStatus | "all"} />
        )}
      </div>
    </motion.div>
  )
}
