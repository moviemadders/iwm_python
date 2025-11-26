"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MovieReviewCreation } from "@/components/review/movie-review-creation"
import { getApiUrl } from "@/lib/api-config"
import { getCurrentUser } from "@/lib/auth"

export default function EditReviewPage() {
    const params = useParams()
    const router = useRouter()
    const movieId = params.id as string
    const [movie, setMovie] = useState<any>(null)
    const [initialData, setInitialData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const apiBase = getApiUrl()
                const user = await getCurrentUser()

                if (!user) {
                    router.push(`/login?redirect=/movies/${movieId}/review/edit`)
                    return
                }

                // Fetch movie details
                const movieRes = await fetch(`${apiBase}/api/v1/movies/${movieId}`)
                if (!movieRes.ok) {
                    throw new Error("Failed to fetch movie details")
                }
                const movieData = await movieRes.json()

                // Fetch user's review for this movie
                const reviewsRes = await fetch(`${apiBase}/api/v1/reviews?movieId=${movieId}`)
                if (!reviewsRes.ok) {
                    throw new Error("Failed to fetch reviews")
                }
                const reviews = await reviewsRes.json()
                const userReview = reviews.find((r: any) => r.author.id === user.id)

                if (!userReview) {
                    throw new Error("Review not found")
                }

                setMovie({
                    id: movieData.external_id || movieData.id,
                    title: movieData.title,
                    posterUrl: movieData.poster_url,
                    year: movieData.release_date ? new Date(movieData.release_date).getFullYear().toString() : "N/A",
                    genres: movieData.genres || [],
                    sidduScore: movieData.siddu_score || 0,
                    director: movieData.director || "Unknown",
                    runtime: movieData.runtime || "N/A",
                })

                setInitialData({
                    id: userReview.id,
                    rating: userReview.rating,
                    content: userReview.content,
                    hasSpoilers: userReview.hasSpoilers || false,
                    gifUrl: userReview.gifUrl || null
                })

            } catch (err) {
                console.error("Error fetching data:", err)
                setError(err instanceof Error ? err.message : "Failed to load data")
            } finally {
                setIsLoading(false)
            }
        }

        if (movieId) {
            fetchData()
        }
    }, [movieId, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-siddu-bg-primary flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00BFFF] border-r-transparent"></div>
                    <div className="text-siddu-text-subtle">Loading review data...</div>
                </div>
            </div>
        )
    }

    if (error || !movie) {
        return (
            <div className="min-h-screen bg-siddu-bg-primary flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="text-red-500 text-xl">⚠️</div>
                    <div className="text-siddu-text-light font-semibold">Failed to Load Review</div>
                    <div className="text-siddu-text-subtle">{error || "Review not found"}</div>
                    <Button onClick={() => router.back()} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-siddu-bg-primary">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6 text-siddu-text-subtle hover:text-siddu-text-light"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Movie
                </Button>

                <div className="max-w-4xl mx-auto">
                    <MovieReviewCreation
                        movie={movie}
                        initialData={initialData}
                        reviewId={initialData?.id}
                        onCancel={() => router.back()}
                    />
                </div>
            </motion.div>
        </div>
    )
}
