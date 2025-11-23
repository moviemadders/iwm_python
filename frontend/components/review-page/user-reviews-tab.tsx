"use client"

import { motion } from "framer-motion"
import type { UserReviewsTabProps } from "@/types/review-page"
import ReviewFilterBar from "./review-filter-bar"
import UserReviewCardV2 from "./user-review-card-v2"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function UserReviewsTab({
  reviews,
  isLoading,
  filters,
  sortBy,
  searchQuery,
  pagination,
  onFilterChange,
  onSortChange,
  onSearchChange,
  onLoadMore,
  currentUserId,
}: UserReviewsTabProps) {
  const handleHelpfulClick = (reviewId: number) => {
    // TODO: Implement helpful vote API call
    console.log("Helpful clicked for review:", reviewId)
  }

  const handleUnhelpfulClick = (reviewId: number) => {
    // TODO: Implement unhelpful vote API call
    console.log("Unhelpful clicked for review:", reviewId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00BFFF] border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Filter Bar */}
      <ReviewFilterBar
        filters={filters}
        sortBy={sortBy}
        searchQuery={searchQuery}
        onFilterChange={onFilterChange}
        onSortChange={onSortChange}
        onSearchChange={onSearchChange}
      />

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-24 h-24 rounded-full bg-[#282828] border border-[#3A3A3A] flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-[#A0A0A0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[#E0E0E0] font-inter mb-2">
            No Reviews Found
          </h3>
          <p className="text-[#A0A0A0] text-center max-w-md">
            {searchQuery
              ? "No reviews match your search criteria. Try adjusting your filters."
              : "No user reviews yet. Be the first to review this movie!"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4 mt-6">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
            >
              <UserReviewCardV2
                review={review}
                isCurrentUser={currentUserId === review.user.username}
                onHelpfulClick={handleHelpfulClick}
                onUnhelpfulClick={handleUnhelpfulClick}
              />
            </motion.div>
          ))}

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={onLoadMore}
                disabled={pagination.isLoadingMore}
                className="bg-[#00BFFF] text-[#1A1A1A] hover:bg-[#0080FF] font-semibold px-8"
              >
                {pagination.isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  "Load More Reviews"
                )}
              </Button>
            </div>
          )}

          {/* End of Reviews Message */}
          {!pagination.hasMore && reviews.length > 0 && (
            <div className="text-center py-6">
              <p className="text-[#A0A0A0] text-sm">
                You've reached the end of the reviews. That's all folks!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

