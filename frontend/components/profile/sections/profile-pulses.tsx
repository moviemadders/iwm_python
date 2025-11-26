"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, Film } from "lucide-react"
import { EmptyState } from "@/components/profile/empty-state"
import { PulseCard } from "@/components/pulse-card"
import { getFeed } from "@/lib/api/pulses"
import { useToast } from "@/hooks/use-toast"

interface ProfilePulsesProps {
  userId: string
}

export function ProfilePulses({ userId }: ProfilePulsesProps) {
  const [pulses, setPulses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPulses = async () => {
      setIsLoading(true)
      console.log('========================================')
      console.log('[ProfilePulses] Component mounting/updating')
      console.log('[ProfilePulses] Received userId prop:', userId)
      console.log('[ProfilePulses] userId type:', typeof userId)
      console.log('========================================')
      try {
        console.log('[ProfilePulses] Fetching pulses for userId:', userId)
        const data = await getFeed({ userId, limit: 20 })
        console.log('[ProfilePulses] Received data:', data.length, 'pulses')
        
        // Map backend data to PulseCard format
        const mapped = data.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          username: p.userInfo.username,
          isVerified: p.userInfo.isVerified,
          avatarUrl: p.userInfo.avatarUrl,
          timestamp: new Date(p.timestamp).toLocaleDateString(), // Simple formatting
          content: p.content.text,
          hashtags: p.content.hashtags || [],
          contentMedia: p.content.media || [],
          linkedMovieId: p.linkedMovie?.id,
          linkedMovieTitle: p.linkedMovie?.title,
          linkedMoviePoster: p.linkedMovie?.posterUrl,
          likes: p.engagement.reactions.total,
          comments: p.engagement.comments,
          shares: p.engagement.shares,
          userHasLiked: !!p.engagement.userReaction,
        }))
        
        setPulses(mapped)
      } catch (err) {
        console.error("Failed to load user pulses:", err)
        toast({
          title: "Error",
          description: "Failed to load pulses. Please try again.",
          variant: "destructive",
        })
        setPulses([])
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchPulses()
    }
  }, [userId, toast])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  if (isLoading) {
    return (
      <div className="bg-[#282828] rounded-lg p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00BFFF] animate-spin mr-2" />
        <span className="text-[#E0E0E0] font-dmsans">Loading pulses...</span>
      </div>
    )
  }

  if (pulses.length === 0) {
    return (
      <EmptyState
        icon={<Film className="w-8 h-8" />}
        title="No pulses yet"
        description="This user hasn't posted any pulses yet."
      />
    )
  }

  return (
    <motion.div 
      className="space-y-6 max-w-2xl mx-auto" 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible"
    >
      {pulses.map((pulse) => (
        <motion.div key={pulse.id} variants={itemVariants}>
          <PulseCard pulse={pulse} />
        </motion.div>
      ))}
    </motion.div>
  )
}
