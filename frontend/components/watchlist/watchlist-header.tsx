"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Import, Layers, CheckSquare, Grid } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { WatchStatus, GroupByOption } from "./types"

interface WatchlistHeaderProps {
  activeStatus: WatchStatus | "all"
  onStatusChange: (status: WatchStatus | "all") => void
  itemCount: number
  onGroupByChange: (groupBy: GroupByOption | null) => void
  isBatchMode: boolean
  onToggleBatchMode: () => void
}

export function WatchlistHeader({
  activeStatus,
  onStatusChange,
  itemCount,
  onGroupByChange,
  isBatchMode,
  onToggleBatchMode
}: WatchlistHeaderProps) {
  return (
    <motion.div
      className="bg-gradient-to-b from-[#282828] to-[#1A1A1A] py-8 px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <motion.h1
              className="text-3xl font-bold text-[#E0E0E0]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              My Watchlist
            </motion.h1>
            <span className="text-[#A0A0A0] text-lg font-medium">{itemCount} items</span>
          </div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant={isBatchMode ? "secondary" : "outline"}
              onClick={onToggleBatchMode}
              className={isBatchMode ? "bg-[#00BFFF] text-[#1A1A1A] hover:bg-[#00BFFF]/90" : "border-[#3A3A3A] text-[#E0E0E0] hover:bg-[#3A3A3A]"}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              {isBatchMode ? "Done" : "Batch Edit"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-[#3A3A3A] text-[#E0E0E0] hover:bg-[#3A3A3A]">
                  <Layers className="mr-2 h-4 w-4" />
                  Group By
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#282828] border-[#3A3A3A] text-[#E0E0E0]">
                <DropdownMenuItem onClick={() => onGroupByChange(null)}>
                  <Grid className="mr-2 h-4 w-4" /> None
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGroupByChange("status")}>
                  Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGroupByChange("priority")}>
                  Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGroupByChange("genre")}>
                  Genre
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGroupByChange("year")}>
                  Release Year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="border-[#00BFFF] text-[#00BFFF] hover:bg-[#00BFFF]/10">
              <Import className="mr-2 h-4 w-4" />
              Import
            </Button>
          </motion.div>
        </div>

        <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Tabs defaultValue={activeStatus} onValueChange={(value) => onStatusChange(value as WatchStatus | "all")}>
            <TabsList className="bg-[#282828] border border-[#3A3A3A]">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#00BFFF] data-[state=active]:text-[#1A1A1A]">
                All
              </TabsTrigger>
              <TabsTrigger
                value="want-to-watch"
                className="data-[state=active]:bg-[#00BFFF] data-[state=active]:text-[#1A1A1A]"
              >
                Want to Watch
              </TabsTrigger>
              <TabsTrigger
                value="watching"
                className="data-[state=active]:bg-[#00BFFF] data-[state=active]:text-[#1A1A1A]"
              >
                Watching
              </TabsTrigger>
              <TabsTrigger
                value="watched"
                className="data-[state=active]:bg-[#00BFFF] data-[state=active]:text-[#1A1A1A]"
              >
                Watched
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  )
}
