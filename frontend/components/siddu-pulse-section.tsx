"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ChevronRight, Edit, Plus, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PulseCard } from "@/components/pulse-card"
import { useHaptic } from "@/hooks/use-haptic"

interface Pulse {
    id: string
    userId: string
    username: string
    isVerified: boolean
    avatarUrl?: string
    timestamp: string
    content: string
    hashtags: string[]
    likes: number
    comments: number
    shares: number
    userHasLiked: boolean
}

interface SidduPulseSectionProps {
    movieTitle: string
    movieId: string
    pulses: Pulse[]
}

export function SidduPulseSection({ movieTitle, movieId, pulses }: SidduPulseSectionProps) {
    const [isMobile, setIsMobile] = useState(false)
    const sectionRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
    const { trigger } = useHaptic()

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

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

    const buttonVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.2,
                delay: 0.4,
                type: "spring",
                stiffness: 200,
            },
        },
    }

    return (
        <motion.section
            ref={sectionRef}
            className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
        >
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <motion.div className="flex items-center gap-4" variants={itemVariants}>
                        <div className="h-8 w-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shadow-[0_0_15px_var(--primary)]">
                            <Activity className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold font-inter text-white">
                            Pulses about {movieTitle}
                        </h2>
                    </motion.div>

                    {/* Desktop Post Button */}
                    {!isMobile && (
                        <motion.div variants={buttonVariants} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                            <Button 
                                className="bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 font-bold font-inter shadow-[0_0_15px_-5px_var(--primary)]"
                                onClick={() => trigger("medium")}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Post a Pulse
                            </Button>
                        </motion.div>
                    )}
                </div>

                {/* Optional Subtitle */}
                <motion.p className="text-gray-400 font-dmsans text-sm mb-8" variants={itemVariants}>
                    Join the conversation with quick thoughts, reactions, and insights about this movie
                </motion.p>

                {/* Pulse Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                    {pulses.slice(0, isMobile ? 2 : 4).map((pulse, index) => (
                        <motion.div key={pulse.id} variants={itemVariants} custom={index} transition={{ delay: 0.2 + index * 0.1 }}>
                            <PulseCard pulse={pulse} />
                        </motion.div>
                    ))}
                </div>

                {/* View All Button */}
                <motion.div className="flex justify-center md:justify-end" variants={buttonVariants}>
                    <Button
                        variant="ghost"
                        className="text-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 font-inter group"
                        asChild
                        onClick={() => trigger("light")}
                    >
                        <Link href={`/movies/${movieId}/pulses`}>
                            View All Pulses
                            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </motion.div>
            </div>

            {/* Mobile FAB */}
            {isMobile && (
                <motion.div
                    className="fixed bottom-6 right-6 z-50"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 shadow-[0_0_20px_var(--primary)]"
                        aria-label="Post a Pulse"
                        onClick={() => trigger("medium")}
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            )}
        </motion.section>
    )
}
