"use client"

import React, { use as usePromise, useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { MovieHeroSection } from "@/components/movie-hero-section"
import { MovieInfoSection } from "@/components/movie-info-section"
import { MovieScenesSection } from "@/components/scene-explorer/movie-scenes-section"
import { ReviewSystemSection } from "@/components/review-system-section"
import { RelatedMoviesSection } from "@/components/related-movies-section"
import { SidduPulseSection } from "@/components/siddu-pulse-section"
import { WhereToWatchSection } from "@/components/where-to-watch-section"
import { MovieDetailsNavigation } from "@/components/movie-details-navigation"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { addToWatchlist, getWatchlistItem } from "@/lib/api/watchlist"
import { getCurrentUser } from "@/lib/auth"
import { AddToCollectionModal } from "@/components/profile/collections/add-to-collection-modal"
import { addToFavorites, removeFromFavorites, getFavorites } from "@/lib/api/favorites"
import { getApiUrl } from "@/lib/api-config"
import { TrailerModal } from "@/components/ui/trailer-modal"
import { getMoviePulses } from "@/lib/api/pulses"
import { formatDistanceToNow } from "date-fns"
import { getMoviesByGenre } from "@/lib/api"
import { MoviePlayerModal } from "@/components/movies/movie-player-modal"

// Fallback mock movie data (used when backend is unavailable)
const fallbackMovieData = {
    id: "tt1375666",
    title: "Inception",
    backdropUrl: "/dark-blue-city-skyline.png",
    posterUrl: "/inception-movie-poster.png",
    year: "2010",
    duration: "2h 28m",
    language: "English",
    rating: "PG-13",
    sidduScore: 9.2,
    criticsScore: 8.8,
    reviewCount: 1458,
    ratingDistribution: [
        { rating: 10, count: 642 },
        { rating: 9, count: 423 },
        { rating: 8, count: 215 },
        { rating: 7, count: 98 },
        { rating: 6, count: 35 },
        { rating: 5, count: 22 },
        { rating: 4, count: 12 },
        { rating: 3, count: 6 },
        { rating: 2, count: 3 },
        { rating: 1, count: 2 },
    ],
    sentimentAnalysis: {
        positive: 78,
        neutral: 15,
        negative: 7,
        keyPhrases: ["Mind-bending", "Visually stunning", "Great acting", "Complex plot", "Nolan masterpiece"],
    },
    synopsis:
        "Dom Cobb is a skilled thief, the absolute best in the dangerous art of extraction, stealing valuable secrets from deep within the subconscious during the dream state, when the mind is at its most vulnerable. Cobb's rare ability has made him a coveted player in this treacherous new world of corporate espionage, but it has also made him an international fugitive and cost him everything he has ever loved.",
    directors: [{ id: "nm0634240", name: "Christopher Nolan", role: "Director" }],
    writers: [{ id: "nm0634240", name: "Christopher Nolan", role: "Writer" }],
    producers: [
        { id: "nm0634240", name: "Christopher Nolan", role: "Producer" },
        { id: "nm0185584", name: "Emma Thomas", role: "Producer" },
    ],
    genres: ["Action", "Adventure", "Sci-Fi", "Thriller"],
    cast: [
        {
            id: "nm0000138",
            name: "Leonardo DiCaprio",
            role: "Actor",
            character: "Dom Cobb",
            profileUrl: "/leonardo-dicaprio.png",
        },
        {
            id: "nm0330687",
            name: "Joseph Gordon-Levitt",
            role: "Actor",
            character: "Arthur",
            profileUrl: "/joseph-gordon-levitt.png",
        },
        {
            id: "nm0680983",
            name: "Elliot Page",
            role: "Actor",
            character: "Ariadne",
            profileUrl: "/elliot-page.png",
        },
        {
            id: "nm0362766",
            name: "Tom Hardy",
            role: "Actor",
            character: "Eames",
            profileUrl: "/tom-hardy.png",
        },
        {
            id: "nm0913822",
            name: "Ken Watanabe",
            role: "Actor",
            character: "Saito",
            profileUrl: "/ken-watanabe.png",
        },
        {
            id: "nm0614165",
            name: "Dileep Rao",
            role: "Actor",
            character: "Yusuf",
            profileUrl: "/dileep-rao.png",
        },
        {
            id: "nm0000297",
            name: "Michael Caine",
            role: "Actor",
            character: "Miles",
            profileUrl: "/michael-caine.png",
        },
        {
            id: "nm1567113",
            name: "Marion Cotillard",
            role: "Actor",
            character: "Mal",
            profileUrl: "/marion-cotillard.png",
        },
    ],
    featuredScene: {
        thumbnailUrl: "/inception-scene-thumbnail.png",
        title: "The Rotating Hallway Fight",
        timestamp: "1:23:45",
        duration: "3:12",
    },
    reviews: [
        {
            id: "r1",
            userId: "u1",
            username: "MovieBuff42",
            avatarUrl: "/user-avatar-1.png",
            rating: 10,
            verified: true,
            date: "2 days ago",
            content:
                "Christopher Nolan's 'Inception' is a masterpiece of modern cinema that seamlessly blends mind-bending concepts with breathtaking visuals. The film's exploration of dreams within dreams creates a labyrinthine narrative that rewards multiple viewings. Leonardo DiCaprio delivers one of his finest performances as Cobb, a man haunted by his past and seeking redemption. The supporting cast, including Joseph Gordon-Levitt and Marion Cotillard, is equally impressive. Hans Zimmer's score perfectly complements the film's tone, with 'Time' being particularly memorable. The rotating hallway fight scene remains one of the most innovative action sequences in recent memory. While some viewers might find the plot overly complex, the emotional core of the story grounds the high-concept premise. A true cinematic achievement that continues to inspire discussion and analysis years after its release.",
            containsSpoilers: false,
            helpfulCount: 128,
            unhelpfulCount: 12,
        },
        {
            id: "r2",
            userId: "u2",
            username: "FilmCritic101",
            avatarUrl: "/user-avatar-2.png",
            rating: 9,
            verified: true,
            date: "1 week ago",
            content:
                "Inception stands as one of Nolan's most ambitious works, blending high-concept science fiction with emotional depth. The dream-heist premise is executed with precision, though the exposition can feel heavy-handed at times. The film's greatest strength lies in its visual storytelling - the folding Paris scene and zero-gravity hotel fight are particularly stunning. The ending remains perfectly ambiguous, leaving viewers to debate whether Cobb's top stops spinning. My only critique is that some characters feel underdeveloped, serving mainly as vehicles for explaining the dream mechanics. Despite this minor flaw, the film remains a landmark achievement in cinema.",
            containsSpoilers: false,
            helpfulCount: 95,
            unhelpfulCount: 8,
        },
        {
            id: "r3",
            userId: "u3",
            username: "DreamExplorer",
            avatarUrl: "/user-avatar-3.png",
            rating: 10,
            verified: false,
            date: "2 weeks ago",
            content:
                "This film completely changed how I view dreams and reality. The way Nolan constructs the dream layers is genius, and the rules of the dream world are internally consistent. The emotional core of the story - Cobb's guilt over Mal's death and his desperate desire to return to his children - gives weight to the high-concept premise. SPOILER ALERT: The ending with the spinning top is perfect - we don't need to know if Cobb is in reality or a dream, because he's finally accepted his reality and reunited with his children. That's what matters. The scene where Mal appears on the ledge across from Ariadne, explaining how she planted the idea in Mal's mind that her world wasn't real, is heartbreaking. The way this film explores grief and guilt through the metaphor of dreams is incredibly powerful.",
            containsSpoilers: true,
            helpfulCount: 87,
            unhelpfulCount: 5,
        },
        {
            id: "r4",
            userId: "u4",
            username: "CasualViewer",
            avatarUrl: "/user-avatar-4.png",
            rating: 7,
            verified: true,
            date: "3 weeks ago",
            content:
                "Inception is visually impressive and has some great action sequences, but I found the plot unnecessarily convoluted. Sometimes it feels like the film is being complex just for the sake of it. That said, the performances are strong across the board, and the special effects hold up remarkably well. The concept of dream invasion is fascinating, even if the execution gets muddled at times. Worth watching, but be prepared to pay close attention.",
            containsSpoilers: false,
            helpfulCount: 42,
            unhelpfulCount: 15,
        },
    ],
    relatedMovies: [
        {
            id: "tt0816692",
            title: "Interstellar",
            posterUrl: "/interstellar-poster.png",
            sidduScore: 9.0,
        },
        {
            id: "tt1130884",
            title: "Shutter Island",
            posterUrl: "/shutter-island-poster.png",
            sidduScore: 8.5,
        },
        {
            id: "tt0468569",
            title: "The Dark Knight",
            posterUrl: "/dark-knight-poster.png",
            sidduScore: 9.5,
        },
        {
            id: "tt0137523",
            title: "Fight Club",
            posterUrl: "/fight-club-poster.png",
            sidduScore: 8.8,
        },
        {
            id: "tt0133093",
            title: "The Matrix",
            posterUrl: "/matrix-poster.png",
            sidduScore: 9.1,
        },
        {
            id: "tt0482571",
            title: "The Prestige",
            posterUrl: "/prestige-poster.png",
            sidduScore: 8.7,
        },
        {
            id: "tt0209144",
            title: "Memento",
            posterUrl: "/memento-poster.png",
            sidduScore: 8.6,
        },
        {
            id: "tt1853728",
            title: "Django Unchained",
            posterUrl: "/django-unchained-poster.png",
            sidduScore: 8.9,
        },
    ],
    pulses: [
        {
            id: "p1",
            userId: "u5",
            username: "DreamArchitect",
            isVerified: true,
            avatarUrl: "/user-avatar-5.png",
            timestamp: "3 hours ago",
            content:
                "Just rewatched Inception for the 10th time and I'm still noticing new details. The way the music slows down in the deeper dream levels is pure genius. #Inception #Nolan #FilmDetails",
            hashtags: ["Inception", "Nolan", "FilmDetails"],
            likes: 87,
            comments: 12,
            shares: 5,
            userHasLiked: false,
        },
        {
            id: "p2",
            userId: "u6",
            username: "CinematicDreamer",
            isVerified: false,
            avatarUrl: "/user-avatar-6.png",
            timestamp: "Yesterday",
            content:
                "That moment when the city folds in on itself still gives me chills. Visual effects that actually serve the story rather than just looking cool. #Inception #VisualEffects",
            hashtags: ["Inception", "VisualEffects"],
            likes: 54,
            comments: 8,
            shares: 2,
            userHasLiked: true,
        },
        {
            id: "p3",
            userId: "u7",
            username: "FilmComposerFan",
            isVerified: true,
            avatarUrl: "/user-avatar-7.png",
            timestamp: "2 days ago",
            content:
                "Hans Zimmer's score for Inception is a masterpiece on its own. The way 'Time' builds to that emotional climax... I get goosebumps every single time. Listening to it on repeat today. #Inception #HansZimmer #FilmScore",
            hashtags: ["Inception", "HansZimmer", "FilmScore"],
            likes: 112,
            comments: 23,
            shares: 15,
            userHasLiked: false,
        },
        {
            id: "p4",
            userId: "u8",
            username: "MovieTheories",
            isVerified: true,
            avatarUrl: "/user-avatar-8.png",
            timestamp: "3 days ago",
            content:
                "My theory: The entire movie is Cobb's dream, not just the ending. Notice how we never see how the inception idea actually originated? That's because Cobb is the one being incepted. #Inception #FilmTheories #MindBlown",
            hashtags: ["Inception", "FilmTheories", "MindBlown"],
            likes: 203,
            comments: 45,
            shares: 28,
            userHasLiked: true,
        },
        {
            id: "p5",
            userId: "u9",
            username: "CasualMovieGoer",
            isVerified: false,
            avatarUrl: "/user-avatar-9.png",
            timestamp: "1 week ago",
            content:
                "Unpopular opinion: Inception is good but overrated. The exposition is too heavy-handed and some of the dream logic doesn't hold up to scrutiny. Still a solid 7/10 though. #Inception #UnpopularOpinion",
            hashtags: ["Inception", "UnpopularOpinion"],
            likes: 31,
            comments: 67,
            shares: 3,
            userHasLiked: false,
        },
    ],
    streamingOptions: {
        US: [
            {
                id: "netflix-us-sub",
                provider: "Netflix",
                logoUrl: "/netflix-inspired-logo.png",
                type: "subscription",
                quality: "4K",
                url: "https://www.netflix.com/title/70131314",
                verified: true,
            },
            {
                id: "hbo-max-us-sub",
                provider: "HBO Max",
                logoUrl: "/hbo-max-logo.png",
                type: "subscription",
                quality: "HD",
                url: "https://play.hbomax.com/page/urn:hbo:page:GXdkpqAvDDaXCPQEAADe7:type:feature",
                verified: true,
            },
            {
                id: "amazon-us-rent",
                provider: "Amazon Prime Video",
                logoUrl: "/amazon-prime-video-logo.png",
                type: "rent",
                price: "$3.99",
                quality: "HD",
                url: "https://www.amazon.com/Inception-Leonardo-DiCaprio/dp/B0047WJ11G",
                verified: true,
            },
            {
                id: "amazon-us-buy",
                provider: "Amazon Prime Video",
                logoUrl: "/amazon-prime-video-logo.png",
                type: "buy",
                price: "$14.99",
                quality: "4K",
                url: "https://www.amazon.com/Inception-Leonardo-DiCaprio/dp/B0047WJ11G",
                verified: true,
            },
            {
                id: "apple-us-rent",
                provider: "Apple TV+",
                logoUrl: "/apple-tv-plus-logo.png",
                type: "rent",
                price: "$3.99",
                quality: "HD",
                url: "https://tv.apple.com/us/movie/inception/umc.cmc.5z6ypbvmgzs8e8iabj7mwy3wa",
                verified: true,
            },
            {
                id: "apple-us-buy",
                provider: "Apple TV+",
                logoUrl: "/apple-tv-plus-logo.png",
                type: "buy",
                price: "$14.99",
                quality: "4K",
                url: "https://tv.apple.com/us/movie/inception/umc.cmc.5z6ypbvmgzs8e8iabj7mwy3wa",
                verified: true,
            },
        ],
        UK: [
            {
                id: "netflix-uk-sub",
                provider: "Netflix",
                logoUrl: "/netflix-inspired-logo.png",
                type: "subscription",
                quality: "4K",
                url: "https://www.netflix.com/title/70131314",
                verified: true,
            },
            {
                id: "amazon-uk-rent",
                provider: "Amazon Prime Video",
                logoUrl: "/amazon-prime-video-logo.png",
                type: "rent",
                price: "£3.49",
                quality: "HD",
                url: "https://www.amazon.co.uk/Inception-Leonardo-DiCaprio/dp/B00ET1ORSU",
                verified: true,
            },
            {
                id: "amazon-uk-buy",
                provider: "Amazon Prime Video",
                logoUrl: "/amazon-prime-video-logo.png",
                type: "buy",
                price: "£9.99",
                quality: "4K",
                url: "https://www.amazon.co.uk/Inception-Leonardo-DiCaprio/dp/B00ET1ORSU",
                verified: true,
            },
        ],
        IN: [
            {
                id: "amazon-in-rent",
                provider: "Amazon Prime Video",
                logoUrl: "/amazon-prime-video-logo.png",
                type: "rent",
                price: "₹99",
                quality: "HD",
                url: "https://www.primevideo.com/detail/Inception/0HBINLPFPDQNPC9QLVG0XD9BDZ",
                verified: true,
            },
            {
                id: "amazon-in-buy",
                provider: "Amazon Prime Video",
                logoUrl: "/amazon-prime-video-logo.png",
                type: "buy",
                price: "₹499",
                quality: "HD",
                url: "https://www.primevideo.com/detail/Inception/0HBINLPFPDQNPC9QLVG0XD9BDZ",
                verified: true,
            },
            {
                id: "jiocinema-in-free",
                provider: "JioCinema",
                logoUrl: "/jiocinema-logo.png",
                type: "free",
                quality: "HD",
                url: "https://www.jiocinema.com/movies/inception/3732088",
                verified: false,
            },
        ],
        AU: [
            {
                id: "netflix-au-sub",
                provider: "Netflix",
                logoUrl: "/netflix-inspired-logo.png",
                type: "subscription",
                quality: "4K",
                url: "https://www.netflix.com/title/70131314",
                verified: true,
            },
            {
                id: "stan-au-sub",
                provider: "Stan",
                logoUrl: "/generic-streaming-logo.png",
                type: "subscription",
                quality: "HD",
                url: "https://www.stan.com.au/watch/inception",
                verified: true,
            },
        ],
    },
}

export default function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const [isLoading, setIsLoading] = useState(true)
    const [movieData, setMovieData] = useState<any>(fallbackMovieData)
    const [error, setError] = useState<string | null>(null)
    const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)
    const [showCollectionModal, setShowCollectionModal] = useState(false)
    const [isFavorited, setIsFavorited] = useState(false)
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
    const [favoriteId, setFavoriteId] = useState<string | null>(null)
    const [showTrailerModal, setShowTrailerModal] = useState(false)
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
    const [showPlayerModal, setShowPlayerModal] = useState(false)
    const [watchProgress, setWatchProgress] = useState(0)
    const { id: movieId } = usePromise(params)
    const { toast } = useToast()

    // Handler for adding to watchlist
    const handleAddToWatchlist = async () => {
        setIsAddingToWatchlist(true)
        try {
            const user = await getCurrentUser()
            if (!user) {
                toast({
                    title: "Login Required",
                    description: "Please log in or create an account to add movies to your watchlist.",
                    variant: "destructive",
                })
                // Redirect to login with current page as redirect target
                setTimeout(() => {
                    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
                }, 1500)
                return
            }

            await addToWatchlist(user.id, movieId)
            toast({
                title: "Added to Watchlist",
                description: `${movieData.title} has been added to your watchlist.`,
            })
        } catch (error: any) {
            console.error("Failed to add to watchlist:", error)
            const errorMessage = error.message || "Failed to add movie to watchlist. Please try again."

            // Check if it's an authentication error
            if (errorMessage.includes("log in") || errorMessage.includes("Unauthorized")) {
                toast({
                    title: "Login Required",
                    description: "Please log in to add movies to your watchlist.",
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
            setIsAddingToWatchlist(false)
        }
    }

    // Handler for toggling favorites
    const handleToggleFavorite = async () => {
        setIsTogglingFavorite(true)
        const previousState = isFavorited
        const previousFavoriteId = favoriteId

        // Optimistic update
        setIsFavorited(!isFavorited)

        try {
            const user = await getCurrentUser()
            if (!user) {
                toast({
                    title: "Login Required",
                    description: "Please log in or create an account to add movies to your favorites.",
                    variant: "destructive",
                })
                // Rollback optimistic update
                setIsFavorited(previousState)
                // Redirect to login with current page as redirect target
                setTimeout(() => {
                    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
                }, 1500)
                return
            }

            if (isFavorited && favoriteId) {
                // Remove from favorites
                await removeFromFavorites(favoriteId)
                setFavoriteId(null)
                toast({
                    title: "Removed from Favorites",
                    description: `${movieData.title} has been removed from your favorites.`,
                })
            } else {
                // Add to favorites
                const result = await addToFavorites({
                    type: "movie",
                    movieId: movieId,
                })
                setFavoriteId(result.id)
                toast({
                    title: "Added to Favorites",
                    description: `${movieData.title} has been added to your favorites.`,
                })
            }
        } catch (error: any) {
            console.error("Failed to toggle favorite:", error)
            // Rollback optimistic update
            setIsFavorited(previousState)
            setFavoriteId(previousFavoriteId)

            const errorMessage = error.message || "Failed to update favorites. Please try again."

            // Check if it's an authentication error
            if (errorMessage.includes("log in") || errorMessage.includes("Unauthorized")) {
                toast({
                    title: "Login Required",
                    description: "Please log in to manage your favorites.",
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
            setIsTogglingFavorite(false)
        }
    }

    const handlePlayTrailer = () => {
        // If we have a trailer URL in the movie data, use it
        if (movieData.trailerUrl) {
            setTrailerUrl(movieData.trailerUrl)
            setShowTrailerModal(true)
            return
        }

        // Fallback for Inception if no URL in data (for demo purposes)
        if (movieData.title === "Inception") {
            setTrailerUrl("https://www.youtube.com/watch?v=YoHD9XEInc0")
            setShowTrailerModal(true)
            return
        }

        // Generic fallback search on YouTube
        // In a real app, we would fetch this from the API
        const query = encodeURIComponent(`${movieData.title} ${movieData.year} trailer`)
        window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank')
    }

    // Check if movie is already favorited on mount
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            try {
                const user = await getCurrentUser()
                if (!user) return

                const favorites = await getFavorites(1, 100, "movie")
                // Find if this movie is in favorites
                const favorite = favorites.find((fav: any) => {
                    return fav.movieId === movieId || fav.movie?.id === movieId
                })

                if (favorite) {
                    setIsFavorited(true)
                    setFavoriteId(favorite.id)
                }
            } catch (error) {
                console.error("Failed to check favorite status:", error)
            }
        }

        checkFavoriteStatus()
    }, [movieId])

    useEffect(() => {
        const fetchMovie = async () => {
            const apiBase = getApiUrl()

            if (!apiBase) {
                setIsLoading(false)
                return
            }

            try {
                const response = await fetch(`${apiBase}/api/v1/movies/${movieId}`)
                if (!response.ok) {
                    throw new Error(`Failed to fetch movie: ${response.statusText}`)
                }
                const data = await response.json()

                // Fetch reviews to calculate rating distribution
                let ratingDistribution = fallbackMovieData.ratingDistribution
                let sentimentAnalysis = fallbackMovieData.sentimentAnalysis
                let reviewCount = 0
                try {
                    const reviewsResponse = await fetch(`${apiBase}/api/v1/reviews?movieId=${movieId}&limit=1000`)
                    if (reviewsResponse.ok) {
                        const reviews = await reviewsResponse.json()
                        reviewCount = Array.isArray(reviews) ? reviews.length : 0

                        // Calculate rating distribution from actual reviews
                        if (reviewCount > 0) {
                            const distribution: { [key: number]: number } = {}
                            for (let i = 1; i <= 10; i++) {
                                distribution[i] = 0
                            }

                            reviews.forEach((review: any) => {
                                const rating = Math.round(review.rating || 0)
                                if (rating >= 1 && rating <= 10) {
                                    distribution[rating]++
                                }
                            })

                            ratingDistribution = Object.entries(distribution).map(([rating, count]) => ({
                                rating: Number.parseInt(rating),
                                count,
                            })).reverse() // Sort from 10 to 1

                            // Calculate sentiment analysis
                            let pos = 0, neu = 0, neg = 0
                            reviews.forEach((r: any) => {
                                const rating = r.rating || 0
                                if (rating >= 7) pos++
                                else if (rating >= 5) neu++
                                else neg++
                            })

                            sentimentAnalysis = {
                                positive: Math.round((pos / reviewCount) * 100),
                                neutral: Math.round((neu / reviewCount) * 100),
                                negative: Math.round((neg / reviewCount) * 100),
                                keyPhrases: fallbackMovieData.sentimentAnalysis.keyPhrases
                            }
                        }
                    }
                } catch (reviewError) {
                    console.error("Error fetching reviews for rating distribution:", reviewError)
                    console.error("Error fetching reviews for rating distribution:", reviewError)
                }

                // Fetch pulses
                let pulses: any[] = []
                try {
                    const pulsesData = await getMoviePulses(movieId)
                    if (Array.isArray(pulsesData)) {
                        pulses = pulsesData.map((p: any) => ({
                            id: p.id,
                            userId: p.userId,
                            username: p.userInfo.username,
                            isVerified: p.userInfo.isVerified,
                            avatarUrl: p.userInfo.avatarUrl,
                            timestamp: formatDistanceToNow(new Date(p.timestamp), { addSuffix: true }),
                            content: p.content.text,
                            hashtags: p.content.hashtags || [],
                            likes: p.engagement.reactions.total,
                            comments: p.engagement.comments,
                            shares: p.engagement.shares,
                            userHasLiked: !!p.engagement.userReaction,
                        }))
                    }
                } catch (pulseError) {
                    console.error("Error fetching pulses:", pulseError)
                }

                // Fetch related movies
                let relatedMovies: any[] = []
                try {
                    if (data.genreSlugs && data.genreSlugs.length > 0) {
                        const related = await getMoviesByGenre(data.genreSlugs[0], { limit: 5 })
                        relatedMovies = related.filter((m: any) => m.id !== data.id).slice(0, 4)
                    }
                } catch (relatedError) {
                    console.error("Error fetching related movies:", relatedError)
                }

                // Fetch watch progress
                try {
                    const user = await getCurrentUser()
                    if (user) {
                        const watchItem = await getWatchlistItem(user.id, movieId)
                        if (watchItem && watchItem.progress_seconds) {
                            setWatchProgress(watchItem.progress_seconds)
                        }
                    }
                } catch (progressError) {
                    console.error("Error fetching watch progress:", progressError)
                }

                // Transform backend data to match component expectations
                const transformedData = {
                    id: data.id,
                    title: data.title,
                    backdropUrl: data.backdropUrl || fallbackMovieData.backdropUrl,
                    posterUrl: data.posterUrl || fallbackMovieData.posterUrl,
                    year: data.year,
                    duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : "N/A",
                    language: data.language || "English",
                    rating: data.rating || "Not Rated",
                    sidduScore: data.sidduScore || 0,
                    criticsScore: data.criticsScore || 0,
                    reviewCount,
                    ratingDistribution,
                    sentimentAnalysis: sentimentAnalysis,
                    synopsis: data.synopsis || data.overview || "",
                    directors: data.directors || [],
                    writers: data.writers || [],
                    producers: data.producers || [],
                    genres: data.genres || [],
                    cast: data.cast || [],
                    streamingOptions: data.streamingOptions || {},
                    relatedMovies: relatedMovies,
                    pulses: pulses,
                    videoUrl: data.videoUrl,
                    videoSource: data.videoSource,
                    isFree: data.isFree,
                }

                setMovieData(transformedData)
            } catch (err) {
                console.error("Error fetching movie:", err)
                setError(err instanceof Error ? err.message : "Failed to load movie")
                // Keep using fallback data on error
            } finally {
                setIsLoading(false)
            }
        }

        fetchMovie()
    }, [movieId])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#282828] border-t-[#00BFFF] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1A1A1A]">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-10 bg-[#1A1A1A]/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
                    <Link href="/movies" className="text-[#E0E0E0] hover:text-[#00BFFF] transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                        <span className="sr-only">Back</span>
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <MovieHeroSection
                movie={movieData}
                onAddToWatchlist={handleAddToWatchlist}
                isAddingToWatchlist={isAddingToWatchlist}
                onAddToCollection={() => setShowCollectionModal(true)}
                onToggleFavorite={handleToggleFavorite}
                isFavorited={isFavorited}
                isTogglingFavorite={isTogglingFavorite}
                onPlayTrailer={handlePlayTrailer}
                onWatchClick={movieData.videoUrl ? () => setShowPlayerModal(true) : undefined}
            />

            {/* Navigation */}
            <MovieDetailsNavigation movieId={movieId} movieTitle={movieData.title} />

            {/* Key Information & Cast Section */}
            <MovieInfoSection movie={movieData} />

            {/* Where to Watch Section */}
            <WhereToWatchSection
                movieId={movieData.id}
                movieTitle={movieData.title}
                streamingOptions={movieData.streamingOptions}
                userRegion="US"
            />

            {/* Movie Scenes Section - NEW COMPONENT */}
            <MovieScenesSection movieId={movieData.id} movieTitle={movieData.title} limit={4} showViewAll={true} />

            {/* Review System Section */}
            <ReviewSystemSection movie={movieData} />

            {/* Related Movies Section */}
            <RelatedMoviesSection movies={movieData.relatedMovies} />

            {/* Siddu Pulse Section */}
            <SidduPulseSection movieTitle={movieData.title} movieId={movieData.id} pulses={movieData.pulses} />

            {/* Rest of the content would go here */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* This is just a placeholder for the rest of the movie details page */}
                <div className="h-[20vh] flex items-center justify-center text-[#A0A0A0] text-lg font-dmsans">
                    Additional movie details would appear here
                </div>
            </div>

            {/* Add to Collection Modal */}
            {showCollectionModal && (
                <AddToCollectionModal
                    movieId={movieId}
                    movieTitle={movieData.title}
                    onClose={() => setShowCollectionModal(false)}
                />
            )}

            {/* Trailer Modal */}
            <TrailerModal
                isOpen={showTrailerModal}
                onClose={() => setShowTrailerModal(false)}
                trailerUrl={trailerUrl || ""}
            />

            <MoviePlayerModal
                isOpen={showPlayerModal}
                onClose={() => setShowPlayerModal(false)}
                videoUrl={movieData.videoUrl || ""}
                videoSource={movieData.videoSource || "youtube"}
                movieId={movieId}
                title={movieData.title}
                initialProgress={watchProgress}
                totalDuration={0}
            />
        </div>
    )
}
