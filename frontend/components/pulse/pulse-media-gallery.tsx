"use client"

import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import PulseVideoPlayer from "./pulse-video-player"

interface MediaItem {
  type?: "image" | "video"
  url: string
}

interface PulseMediaGalleryProps {
  media: (MediaItem | string)[]
}

export default function PulseMediaGallery({ media }: PulseMediaGalleryProps) {
  if (!media || media.length === 0) return null

  // Normalize media items
  const items = media.map((item) => {
    if (typeof item === "string") {
      const isVideo = item.match(/\.(mp4|webm|ogg|mov)$/i)
      return {
        type: isVideo ? "video" : "image",
        url: item,
      } as MediaItem
    }
    return item
  })

  // Single Item
  if (items.length === 1) {
    const item = items[0]
    return (
      <div className="rounded-xl overflow-hidden border border-[#3A3A3A] bg-black">
        {item.type === "video" ? (
          <PulseVideoPlayer src={item.url} className="max-h-[500px]" />
        ) : (
          <div className="relative w-full h-auto max-h-[500px]">
             <img
              src={item.url}
              alt="Media"
              className="w-full h-full object-contain max-h-[500px]"
              onClick={() => window.open(item.url, '_blank')}
            />
          </div>
        )}
      </div>
    )
  }

  // Multiple Items (Carousel)
  return (
    <Carousel className="w-full">
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <div className="rounded-xl overflow-hidden border border-[#3A3A3A] bg-black flex items-center justify-center h-[300px] md:h-[400px]">
                {item.type === "video" ? (
                  <PulseVideoPlayer src={item.url} className="w-full h-full" />
                ) : (
                  <img
                    src={item.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={() => window.open(item.url, '_blank')}
                  />
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2 bg-black/50 border-none text-white hover:bg-black/70" />
      <CarouselNext className="right-2 bg-black/50 border-none text-white hover:bg-black/70" />
    </Carousel>
  )
}
