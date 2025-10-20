"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import ConversationList from "@/components/ConversationList"
import ChatInterface from "@/components/ChatInterface"
import AITrainerChat from "@/components/AITrainerChat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Users, ArrowLeft, Bot, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedConversationId, setSelectedConversationId] = useState<string>()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatMode, setChatMode] = useState<"human" | "ai">("human") // Toggle between human trainer and AI

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/login")
      return
    }

    if (session.user.role !== "CLIENT" && session.user.role !== "TRAINER" && session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    fetchConversations()
  }, [session, status, router])

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/chat/conversations")
      const data = await response.json()
      if (response.ok) {
        setConversations(data.conversations || [])
        // Auto-select first conversation if available
        if (data.conversations && data.conversations.length > 0) {
          setSelectedConversationId(data.conversations[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={session.user.role === "CLIENT" ? "/client" : "/dashboard"}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {session.user.role === "CLIENT" ? "Back to Schedule" : "Back to Dashboard"}
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
          </div>

          {/* Chat Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setChatMode("human")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                chatMode === "human"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4" />
              {session.user.role === "CLIENT" ? "My Trainer" : "My Clients"}
            </button>
            <button
              onClick={() => setChatMode("ai")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                chatMode === "ai"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span className="flex items-center gap-1">
                Coach AI
                <Sparkles className="h-3 w-3" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex h-[calc(100vh-80px)]">
        {chatMode === "human" ? (
          <>
            <ConversationList
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversationId}
            />
            <ChatInterface
              conversations={conversations}
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversationId}
            />
          </>
        ) : (
          <AITrainerChat />
        )}
      </div>
    </div>
  )
}
