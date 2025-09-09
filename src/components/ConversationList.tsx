"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Users, Clock } from "lucide-react"
import { useSession } from "next-auth/react"

interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
    role: string
  }
  messageType: string
  isRead: boolean
}

interface Conversation {
  id: string
  client?: {
    id: string
    name: string
    email: string
  }
  trainer?: {
    id: string
    name: string
    email: string
  }
  messages: Message[]
  _count: {
    messages: number
  }
  updatedAt: string
}

interface ConversationListProps {
  onConversationSelect: (conversationId: string) => void
  selectedConversationId?: string
}

export default function ConversationList({ 
  onConversationSelect, 
  selectedConversationId 
}: ConversationListProps) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/chat/conversations")
      const data = await response.json()
      if (response.ok) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const getOtherUser = (conversation: Conversation) => {
    return session?.user?.role === "CLIENT" 
      ? conversation.trainer 
      : conversation.client
  }

  const getLastMessage = (conversation: Conversation) => {
    return conversation.messages[0] || null
  }

  if (isLoading) {
    return (
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-red-500" />
          Messages
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation)
              const lastMessage = getLastMessage(conversation)
              const unreadCount = conversation._count.messages
              const isSelected = conversation.id === selectedConversationId

              return (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'bg-red-50 border-red-200 shadow-md' 
                      : 'hover:bg-white'
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {otherUser?.name}
                          </h3>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(conversation.updatedAt)}</span>
                          </div>
                        </div>
                        {lastMessage ? (
                          <p className="text-sm text-gray-600 truncate">
                            {lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            No messages yet
                          </p>
                        )}
                        {unreadCount > 0 && (
                          <div className="flex justify-end mt-1">
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
