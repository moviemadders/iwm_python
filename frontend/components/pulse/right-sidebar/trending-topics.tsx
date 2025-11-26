'use client'

/**
 * Trending Topics Component
 * Top 5 trending hashtags
 */

import { TrendingTopic } from '@/types/pulse'
import { Flame, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface TrendingTopicsProps {
  topics: TrendingTopic[]
  onTopicClick: (hashtag: string) => void
}

export default function TrendingTopics({ topics, onTopicClick }: TrendingTopicsProps) {
  return (
    <div className="bg-[#282828] border border-[#3A3A3A] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-[#FF6B35]" />
        <h3 className="font-bold text-[#E0E0E0] font-['Inter']">Trending Now</h3>
      </div>

      <div className="space-y-3">
        {topics.map((topic, index) => (
          <button
            key={topic.id}
            onClick={() => onTopicClick(topic.hashtag)}
            className="w-full text-left p-3 rounded-lg hover:bg-[#3A3A3A] transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#A0A0A0]">#{index + 1}</span>
                  <span className="font-bold text-[#00BFFF] group-hover:underline">
                    {topic.hashtag}
                  </span>
                  {topic.is_rising && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp size={14} className="text-[#10B981]" />
                    </motion.div>
                  )}
                </div>
                <p className="text-xs text-[#A0A0A0] mt-1">
                  {(topic.pulse_count || 0).toLocaleString()} pulses
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

