import Image from "next/image"

interface UserAvatarProps {
    src?: string | null
    alt: string
    fallbackName: string
    size?: number
    className?: string
}

export function UserAvatar({
    src,
    alt,
    fallbackName,
    size = 40,
    className = ""
}: UserAvatarProps) {
    const initial = fallbackName?.charAt(0)?.toUpperCase() || '?'
    const shouldShowFallback = !src || src === '/user-avatar.png' || src === '/placeholder.svg'

    return (
        <div
            className={`relative rounded-full overflow-hidden bg-gradient-to-br from-[#00BFFF] to-[#0080CC] ${className}`}
            style={{ width: size, height: size }}
        >
            {shouldShowFallback ? (
                <div className="w-full h-full flex items-center justify-center text-white font-semibold" style={{ fontSize: size * 0.45 }}>
                    {initial}
                </div>
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    width={size}
                    height={size}
                    className="object-cover"
                    onError={(e) => {
                        // If image fails to load, hide it and show fallback
                        e.currentTarget.style.display = 'none'
                    }}
                />
            )}
        </div>
    )
}
