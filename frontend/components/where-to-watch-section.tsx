"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Globe, ExternalLink, Info, MonitorPlay } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { useHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

interface StreamingOption {
  id: string
  provider: string
  logoUrl: string
  type: "subscription" | "rent" | "buy" | "free"
  price?: string
  quality: "SD" | "HD" | "4K" | "8K"
  url: string
  verified: boolean
}

interface WhereToWatchSectionProps {
  movieId: string
  movieTitle: string
  streamingOptions: {
    [region: string]: StreamingOption[]
  }
  userRegion?: string
}

export function WhereToWatchSection({
  movieId,
  movieTitle,
  streamingOptions,
  userRegion = "US",
}: WhereToWatchSectionProps) {
  const [selectedRegion, setSelectedRegion] = useState(userRegion)
  const [activeTab, setActiveTab] = useState<"all" | "subscription" | "rent" | "buy" | "free">("all")
  const { trigger } = useHaptic()

  const availableRegions = Object.keys(streamingOptions).sort()
  const currentRegionOptions = streamingOptions[selectedRegion] || []

  const filteredOptions =
    activeTab === "all" ? currentRegionOptions : currentRegionOptions.filter((option) => option.type === activeTab)

  // Group options by provider for subscription type
  const groupedSubscriptionOptions = currentRegionOptions
    .filter((option) => option.type === "subscription")
    .reduce<{ [provider: string]: StreamingOption[] }>((acc, option) => {
      if (!acc[option.provider]) {
        acc[option.provider] = []
      }
      acc[option.provider].push(option)
      return acc
    }, {})

  // Group options by provider for rent/buy types
  const groupedPurchaseOptions = currentRegionOptions
    .filter((option) => option.type === "rent" || option.type === "buy")
    .reduce<{ [provider: string]: StreamingOption[] }>((acc, option) => {
      if (!acc[option.provider]) {
        acc[option.provider] = []
      }
      acc[option.provider].push(option)
      return acc
    }, {})

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

  return (
    <motion.section
      className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      {/* Section Title */}
      <motion.div className="flex flex-col md:flex-row md:items-center justify-between mb-8" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="h-8 w-1 bg-[var(--secondary)] rounded-full shadow-[0_0_10px_var(--secondary)]" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-inter text-white">Where to Watch</h2>
            <p className="text-gray-400 font-dmsans text-sm mt-1">Find where to stream, rent, or buy in your region</p>
          </div>
        </div>

        {/* Region Selector */}
        <div className="flex items-center">
          <Globe className="mr-2 h-4 w-4 text-[var(--primary)]" />
          <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); trigger("medium"); }}>
            <SelectTrigger className="w-[180px] bg-[#111] border-white/10 text-white focus:ring-[var(--primary)]">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10 text-white">
              {availableRegions.map((region) => (
                <SelectItem key={region} value={region} className="focus:bg-[var(--primary)]/20 focus:text-[var(--primary)] cursor-pointer">
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* No Streaming Options Message */}
      {currentRegionOptions.length === 0 && (
        <motion.div
          className="glass-panel rounded-xl p-8 text-center border border-white/5 max-w-2xl mx-auto"
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-[var(--primary)]/20 blur-3xl rounded-full" />
            <MonitorPlay className="h-16 w-16 mx-auto text-[var(--primary)] relative z-10" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Not Available for Streaming Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-8 text-lg">
            {movieTitle} isn't currently available to watch in {selectedRegion}. 
            We'll keep checking and let you know when it arrives.
          </p>
          
          <button 
            className="px-8 py-3 bg-[var(--primary)] text-black font-bold rounded-full hover:bg-[var(--primary)]/90 hover:scale-105 transition-all shadow-[0_0_20px_-5px_var(--primary)]"
            onClick={() => trigger("success")}
          >
            Notify Me When Available
          </button>
        </motion.div>
      )}

      {/* Streaming Options */}
      {currentRegionOptions.length > 0 && (
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => { setActiveTab(value as any); trigger("light"); }}>
            <TabsList className="bg-transparent border-b border-white/10 w-full justify-start overflow-x-auto pb-0 h-auto p-0 gap-6 mb-8">
              {["all", "subscription", "rent", "buy", "free"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="data-[state=active]:text-[var(--primary)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-inter text-gray-400 hover:text-white transition-colors capitalize bg-transparent"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0 space-y-8">
              {/* Subscription Section */}
              {Object.keys(groupedSubscriptionOptions).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" /> Subscription
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(groupedSubscriptionOptions).map(([provider, options]) => (
                      <StreamingServiceCard
                        key={provider}
                        provider={provider}
                        logoUrl={options[0].logoUrl}
                        url={options[0].url}
                        type="subscription"
                        quality={options[0].quality}
                        verified={options[0].verified}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Rent/Buy Section */}
              {Object.keys(groupedPurchaseOptions).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)]" /> Rent or Buy
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(groupedPurchaseOptions).map(([provider, options]) => (
                      <PurchaseOptionCard
                        key={provider}
                        provider={provider}
                        logoUrl={options[0].logoUrl}
                        options={options}
                        verified={options[0].verified}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Free Section */}
              {currentRegionOptions.filter((option) => option.type === "free").length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Free
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {currentRegionOptions
                      .filter((option) => option.type === "free")
                      .map((option) => (
                        <StreamingServiceCard
                          key={option.id}
                          provider={option.provider}
                          logoUrl={option.logoUrl}
                          url={option.url}
                          type="free"
                          quality={option.quality}
                          verified={option.verified}
                        />
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Other Tabs Content (Simplified for brevity, following same pattern) */}
            {/* ... (Repeat similar structure for individual tabs if needed, or rely on 'all' view logic) ... */}
            {/* For this refactor, I'll keep the 'all' view as the primary one for simplicity, 
                but in a full implementation, each tab would filter accordingly. 
                The logic below handles the specific tabs. */}
            
            {(["subscription", "rent", "buy", "free"] as const).map((tabType) => (
                <TabsContent key={tabType} value={tabType} className="mt-0">
                    {/* Logic to display specific type */}
                    {tabType === "subscription" && Object.keys(groupedSubscriptionOptions).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Object.entries(groupedSubscriptionOptions).map(([provider, options]) => (
                                <StreamingServiceCard key={provider} provider={provider} logoUrl={options[0].logoUrl} url={options[0].url} type="subscription" quality={options[0].quality} verified={options[0].verified} />
                            ))}
                        </div>
                    )}
                    {(tabType === "rent" || tabType === "buy") && Object.keys(groupedPurchaseOptions).length > 0 && (
                         <div className="grid grid-cols-1 gap-4">
                            {Object.entries(groupedPurchaseOptions)
                                .filter(([_, options]) => options.some((opt) => opt.type === tabType))
                                .map(([provider, options]) => (
                                <PurchaseOptionCard key={provider} provider={provider} logoUrl={options[0].logoUrl} options={options.filter((opt) => opt.type === tabType)} verified={options[0].verified} />
                            ))}
                         </div>
                    )}
                    {tabType === "free" && currentRegionOptions.filter((option) => option.type === "free").length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {currentRegionOptions.filter((option) => option.type === "free").map((option) => (
                                <StreamingServiceCard key={option.id} provider={option.provider} logoUrl={option.logoUrl} url={option.url} type="free" quality={option.quality} verified={option.verified} />
                            ))}
                        </div>
                    )}
                    
                    {/* Empty States */}
                    {((tabType === "subscription" && Object.keys(groupedSubscriptionOptions).length === 0) ||
                      ((tabType === "rent" || tabType === "buy") && Object.keys(groupedPurchaseOptions).filter(k => groupedPurchaseOptions[k].some(o => o.type === tabType)).length === 0) ||
                      (tabType === "free" && currentRegionOptions.filter(o => o.type === "free").length === 0)) && (
                        <div className="glass-panel rounded-xl p-8 text-center border border-white/5">
                            <p className="text-gray-400">No {tabType} options available for {movieTitle} in {selectedRegion}</p>
                        </div>
                    )}
                </TabsContent>
            ))}

          </Tabs>
        </motion.div>
      )}

      {/* Disclaimer */}
      <motion.div
        className="mt-8 text-xs text-gray-500 text-center max-w-2xl mx-auto font-mono"
        variants={itemVariants}
        custom={3}
      >
        <p>
          Streaming availability information is provided by our partners and is accurate as of{" "}
          {new Date().toLocaleDateString()}. Availability may change over time.
        </p>
      </motion.div>
    </motion.section>
  )
}

interface StreamingServiceCardProps {
  provider: string
  logoUrl: string
  url: string
  type: "subscription" | "rent" | "buy" | "free"
  quality: "SD" | "HD" | "4K" | "8K"
  verified: boolean
}

function StreamingServiceCard({ provider, logoUrl, url, type, quality, verified }: StreamingServiceCardProps) {
  const { trigger } = useHaptic()
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-[var(--primary)]/50 transition-all duration-300 shadow-lg group"
      onClick={() => trigger("light")}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 h-full flex flex-col items-center text-center"
      >
        <div className="relative w-16 h-16 mb-3">
          <Image
            src={logoUrl || "/placeholder.svg?height=64&width=64&query=streaming service logo"}
            alt={provider}
            fill
            className="object-contain drop-shadow-lg"
          />
        </div>
        <h4 className="font-medium text-white mb-1 group-hover:text-[var(--primary)] transition-colors">{provider}</h4>
        <div className="flex items-center justify-center gap-2 mt-auto pt-2">
          <Badge variant="outline" className="text-[10px] font-normal border-white/10 text-gray-400">
            {quality}
          </Badge>
          {verified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20"
                  >
                    Verified
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Link verified within the last 24 hours</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </a>
    </motion.div>
  )
}

interface PurchaseOptionCardProps {
  provider: string
  logoUrl: string
  options: StreamingOption[]
  verified: boolean
}

function PurchaseOptionCard({ provider, logoUrl, options, verified }: PurchaseOptionCardProps) {
  const { trigger } = useHaptic()
  // Sort options by type (rent first, then buy) and then by price
  const sortedOptions = [...options].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "rent" ? -1 : 1
    }
    const priceA = a.price ? Number.parseFloat(a.price.replace(/[^0-9.]/g, "")) : 0
    const priceB = b.price ? Number.parseFloat(b.price.replace(/[^0-9.]/g, "")) : 0
    return priceA - priceB
  })

  return (
    <motion.div 
        whileHover={{ scale: 1.01 }} 
        className="bg-[#111] rounded-xl overflow-hidden p-4 border border-white/5 hover:border-[var(--secondary)]/50 transition-all duration-300"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={logoUrl || "/placeholder.svg?height=48&width=48&query=streaming service logo"}
            alt={provider}
            fill
            className="object-contain"
          />
        </div>
        <div>
          <h4 className="font-medium text-white">{provider}</h4>
          {verified && (
            <Badge
              variant="outline"
              className="text-[10px] font-normal bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 mt-1"
            >
              Verified
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedOptions.map((option) => (
          <a
            key={`${option.id}-${option.type}-${option.quality}`}
            href={option.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors group"
            onClick={() => trigger("light")}
          >
            <div className="flex items-center gap-2">
              <Badge variant={option.type === "rent" ? "secondary" : "default"} className="capitalize">
                {option.type}
              </Badge>
              <Badge variant="outline" className="text-xs border-white/10 text-gray-400">
                {option.quality}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white group-hover:text-[var(--primary)] transition-colors">{option.price}</span>
              <ExternalLink size={14} className="text-gray-500 group-hover:text-white transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  )
}
