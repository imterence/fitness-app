"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Bell, MessageCircle } from "lucide-react"

interface MessageNotificationBadgeProps {
  showIcon?: boolean
  iconSize?: "sm" | "md" | "lg"
  className?: string
}

export default function MessageNotificationBadge({ 
  showIcon = true, 
  iconSize = "md",
  className = "" 
}: MessageNotificationBadgeProps) {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!session?.user) return

    // Initial fetch
    fetchUnreadCount()

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [session])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/chat/unread-count")
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  if (!session?.user || unreadCount === 0) {
    return null
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {showIcon && (
        <MessageCircle className={`${iconSizes[iconSize]} text-gray-600`} />
      )}
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-600 text-white text-xs font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      </span>
    </div>
  )
}

