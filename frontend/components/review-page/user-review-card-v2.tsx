"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ThumbsUp, ThumbsDown, MessageCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Pencil, Trash2, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { UserReviewCardProps } from "@/types/review-page"
import { me } from "@/lib/auth"
import { deleteReview, voteOnReview, removeVote, getUserVote } from "@/lib/api/reviews"
import { useToast } from "@/hooks/use-toast"
import { EditReviewModal } from "@/components/reviews/edit-review-modal"

export default function UserReviewCardV2({
    review,
    isCurrentUser,
}: UserReviewCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false)
    const [helpfulCount, setHelpfulCount] = useState(review.helpful_count)
    const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpful_count)
    const [userVote, setUserVote] = useState<"helpful" | "unhelpful" | null>(review.user_vote || null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [gifLoaded, setGifLoaded] = useState(false)
    const [isVoting, setIsVoting] = useState(false)
    const { toast } = useToast()

    // Fetch current user and their vote on mount
    useEffect(() => {
        const fetchUserAndVote = async () => {
            try {
                const user = await me()
                setCurrentUser(user)

                // Fetch user's vote if authenticated
                try {
                    const voteData = await getUserVote(String(review.id))
                    setUserVote(voteData.voteType)
                } catch (error) {
                    console.debug("No vote found or error fetching vote")
                }
            } catch (error) {
                console.debug("User not authenticated")
            }
        }
        fetchUserAndVote()
    }, [review.id])

    const handleHelpfulClick = async () => {
        if (!currentUser) {
            toast({
                title: "Login Required",
                description: "Please log in to vote on reviews",
                variant: "destructive",
            })
            return
        }

        if (isVoting) return
        setIsVoting(true)

        try {
            // Toggle vote if same type, otherwise change vote
            if (userVote === "helpful") {
                await removeVote(String(review.id))
                setHelpfulCount(prev => Math.max(0, prev - 1))
                setUserVote(null)
            } else {
                await voteOnReview(String(review.id), "helpful")
                if (userVote === "unhelpful") {
                    setUnhelpfulCount(prev => Math.max(0, prev - 1))
                }
                setHelpfulCount(prev => prev + 1)
                setUserVote("helpful")
            }
        } catch (error) {
            console.error("Error voting:", error)
            toast({
                title: "Vote Failed",
                description: "Failed to register your vote. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsVoting(false)
        }
    }

    const handleUnhelpfulClick = async () => {
        if (!currentUser) {
            toast({
                title: "Login Required",
                description: "Please log in to vote on reviews",
                variant: "destructive",
            })
            return
        }

        if (isVoting) return
        setIsVoting(true)

        try {
            // Toggle vote if same type, otherwise change vote
            if (userVote === "unhelpful") {
                await removeVote(String(review.id))
                setUnhelpfulCount(prev => Math.max(0, prev - 1))
                setUserVote(null)
            } else {
                await voteOnReview(String(review.id), "unhelpful")
                if (userVote === "helpful") {
                    setHelpfulCount(prev => Math.max(0, prev - 1))
                }
                setUnhelpfulCount(prev => prev + 1)
                setUserVote("unhelpful")
            }
        } catch (error) {
            console.error("Error voting:", error)
            toast({
                title: "Vote Failed",
                description: "Failed to register your vote. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsVoting(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
            return
        }

        setIsDeleting(true)
        try {
            await deleteReview(String(review.id))
            toast({
                title: "Success",
                description: "Review deleted successfully",
            })
            window.location.reload()
        } catch (error: any) {
            console.error("Error deleting review:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to delete review",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleEditSuccess = () => {
        setIsEditModalOpen(false)
        toast({
            title: "Success",
            description: "Review updated successfully",
        })
        window.location.reload()
    }

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-5 h-5 transition-all ${i < rating ? "text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" : "text-[#404040]"
                    }`}
            />
        ))
    }

    const shouldTruncate = review.content.length > 400
    const displayContent = isExpanded || !shouldTruncate ? review.content : review.content.slice(0, 400) + "..."

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`group relative bg-gradient-to-br from-[#2A2A2A] to-[#1E1E1E] rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:shadow-[#00D4FF]/10 ${isCurrentUser
                ? "border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                : "border-[#404040] hover:border-[#00D4FF]/50"
                }`}
        >
            {/* Current User Badge */}
            {isCurrentUser && (
                <div className="absolute -top-3 -right-3 z-10">
                    <div className="bg-gradient-to-r from-[#00D4FF] to-[#0099FF] text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Your Review
                    </div>
                </div>
            )}

            <div className="p-6 sm:p-8">
                {/* User Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img
                                src={review.user.avatar_url}
                                alt={review.user.display_name}
                                className="w-14 h-14 rounded-full border-2 border-[#404040] shadow-lg"
                            />
                            {review.user.is_verified && (
                                <div className="absolute -bottom-1 -right-1 bg-[#00D4FF] rounded-full p-1">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-lg font-semibold text-[#F0F0F0]">
                                    {review.user.display_name}
                                </h4>
                            </div>
                            <p className="text-sm text-[#B0B0B0]">@{review.user.username}</p>
                            <p className="text-xs text-[#808080] mt-0.5">
                                {new Date(review.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {renderStars(review.rating)}
                    </div>
                </div>

                {/* GIF HERO SECTION */}
                {review.gif_url && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-6 relative overflow-hidden rounded-xl"
                    >
                        {/* Loading Skeleton */}
                        {!gifLoaded && (
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] animate-pulse" />
                        )}

                        <motion.img
                            src={review.gif_url}
                            alt="Review GIF"
                            className={`w-full max-h-[400px] object-contain rounded-xl border border-[#404040] transition-all duration-300 ${gifLoaded ? "opacity-100" : "opacity-0"
                                }`}
                            style={{
                                background: "linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)"
                            }}
                            onLoad={() => setGifLoaded(true)}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        />

                        {/* GIF Glow Effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-[#00D4FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </motion.div>
                )}

                {/* Spoiler Warning */}
                {review.contains_spoilers && !isSpoilerRevealed && (
                    <div className="mb-6 relative">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-[#1A1A1A]/95 to-[#2A2A2A]/95 rounded-xl flex flex-col items-center justify-center z-10 p-8 border-2 border-dashed border-[#F59E0B]/50"
                        >
                            <AlertTriangle className="w-16 h-16 text-[#F59E0B] mb-4 animate-pulse" />
                            <h4 className="text-xl font-bold text-[#F0F0F0] mb-2">
                                ⚠️ Contains Spoilers
                            </h4>
                            <p className="text-sm text-[#B0B0B0] text-center mb-6 max-w-md">
                                This review contains spoilers. Click below to reveal the content.
                            </p>
                            <Button
                                onClick={() => setIsSpoilerRevealed(true)}
                                className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white hover:from-[#D97706] hover:to-[#B45309] font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                Reveal Spoilers
                            </Button>
                        </motion.div>
                        <div className="blur-md select-none pointer-events-none min-h-[100px]">
                            <p className="text-base text-[#E0E0E0] leading-relaxed">{displayContent}</p>
                        </div>
                    </div>
                )}

                {/* Review Content */}
                {(!review.contains_spoilers || isSpoilerRevealed) && (
                    <div className="mb-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isExpanded ? "expanded" : "collapsed"}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <p className="text-base text-[#F0F0F0] leading-relaxed whitespace-pre-wrap font-['Inter']">
                                    {displayContent}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {shouldTruncate && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-4 text-[#00D4FF] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 px-4 py-2 rounded-lg transition-all"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-4 h-4 mr-2" />
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 mr-2" />
                                        Read More
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}

                {/* Action Bar */}
                <div className="pt-6 border-t border-[#404040]">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-6">
                            {/* Helpful Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleHelpfulClick}
                                className={`flex items-center gap-2 text-base font-medium transition-all ${userVote === "helpful"
                                    ? "text-[#10B981]"
                                    : "text-[#B0B0B0] hover:text-[#10B981]"
                                    }`}
                            >
                                <ThumbsUp className={`w-5 h-5 ${userVote === "helpful" ? "fill-current" : ""}`} />
                                <span>{helpfulCount}</span>
                            </motion.button>

                            {/* Unhelpful Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleUnhelpfulClick}
                                className={`flex items-center gap-2 text-base font-medium transition-all ${userVote === "unhelpful"
                                    ? "text-[#EF4444]"
                                    : "text-[#B0B0B0] hover:text-[#EF4444]"
                                    }`}
                            >
                                <ThumbsDown className={`w-5 h-5 ${userVote === "unhelpful" ? "fill-current" : ""}`} />
                                <span>{unhelpfulCount}</span>
                            </motion.button>

                            {/* Comments */}
                            <Link
                                href={`/movies/${review.movie_id}/reviews/${review.id}`}
                                className="flex items-center gap-2 text-base text-[#B0B0B0] hover:text-[#00D4FF] transition-colors cursor-pointer relative z-10"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>{review.comment_count}</span>
                            </Link>
                        </div>

                        {/* Edit/Delete Buttons */}
                        {String(currentUser?.id) === String(review.user.username) && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="border-[#404040] hover:bg-[#00D4FF]/10 hover:border-[#00D4FF] transition-all"
                                >
                                    <Pencil className="w-3.5 h-3.5 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C]"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditReviewModal
                    review={{
                        id: String(review.id),
                        title: "",
                        content: review.content,
                        rating: review.rating,
                        hasSpoilers: review.contains_spoilers,
                    }}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </motion.div>
    )
}
