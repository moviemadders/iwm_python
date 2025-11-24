import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getReviewById } from "@/lib/api/reviews"
import { CommentsSection } from "@/components/review-page/comments-section"
import { ReviewCard } from "@/components/reviews/review-card"

export default async function ReviewDetailPage(props: {
    params: Promise<{ id: string; reviewId: string }>
}) {
    // Await params in Next.js 15
    const params = await props.params

    let review
    try {
        review = await getReviewById(params.reviewId)

        // Map backend response to frontend expected format if needed
        if (review && review.reviewer && !review.author) {
            review.author = {
                id: review.reviewer.id,
                name: review.reviewer.username,
                avatarUrl: review.reviewer.avatarUrl
            }
        }
    } catch (error) {
        console.error("Failed to fetch review:", error)
        notFound()
    }

    return (
        <div className="min-h-screen bg-siddu-bg">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <Link
                    href={`/movies/${params.id}`}
                    className="inline-flex items-center text-siddu-text-subtle hover:text-siddu-text-light mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Movie
                </Link>

                {/* Review Card */}
                <div className="mb-8">
                    <ReviewCard review={review} />
                </div>

                {/* Comments Section */}
                <Suspense fallback={<CommentsSectionSkeleton />}>
                    <CommentsSection
                        reviewId={params.reviewId}
                        comments={[]}
                        commentsCount={review.commentCount || 0}
                    />
                </Suspense>
            </div>
        </div>
    )
}

function CommentsSectionSkeleton() {
    return (
        <div className="bg-siddu-bg-card-dark rounded-lg border border-siddu-border-subtle p-6">
            <div className="animate-pulse">
                <div className="h-6 bg-siddu-border-subtle rounded w-32 mb-4"></div>
                <div className="h-20 bg-siddu-border-subtle rounded mb-4"></div>
                <div className="space-y-4">
                    <div className="h-16 bg-siddu-border-subtle rounded"></div>
                    <div className="h-16 bg-siddu-border-subtle rounded"></div>
                </div>
            </div>
        </div>
    )
}
