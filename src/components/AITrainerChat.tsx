"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react"

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: {
    id: string
    name: string
    role: string
  }
}

export default function AITrainerChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/chat/ai-trainer")
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching AI messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    const messageText = newMessage
    setNewMessage("")
    setIsSending(true)

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageText,
      createdAt: new Date().toISOString(),
      senderId: session?.user?.id || "",
      sender: {
        id: session?.user?.id || "",
        name: session?.user?.name || "You",
        role: session?.user?.role || "CLIENT"
      }
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.senderId === "ai-trainer-bot" ? "assistant" : "user",
        content: msg.content
      }))

      const response = await fetch("/api/chat/ai-trainer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: messageText,
          conversationHistory
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Replace temp message with real one and add AI response
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMessage.id),
          {
            ...data.userMessage,
            sender: {
              id: session?.user?.id || "",
              name: session?.user?.name || "You",
              role: session?.user?.role || "CLIENT"
            }
          },
          {
            ...data.aiMessage,
            sender: {
              id: "ai-trainer-bot",
              name: "Coach AI",
              role: "AI_TRAINER"
            }
          }
        ])
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading AI Trainer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <Bot className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Coach AI <Sparkles className="h-5 w-5" />
            </h2>
            <p className="text-sm text-blue-100">Your 24/7 AI Fitness Coach</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Coach AI!</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              I'm your personal AI fitness trainer, available 24/7 to answer your questions about
              workouts, nutrition, Hyrox training, and more. Ask me anything!
            </p>
            <div className="mt-6 space-y-2 max-w-md mx-auto">
              <p className="text-sm text-gray-500 font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "How do I prepare for Hyrox?",
                  "Best exercises for endurance?",
                  "Create a workout plan",
                  "Nutrition tips for athletes"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setNewMessage(suggestion)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.senderId === session?.user?.id
            const isAI = !isUser // If not from user, it's from AI

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    isUser ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isAI
                        ? "bg-gradient-to-br from-blue-500 to-purple-500"
                        : "bg-green-500"
                    }`}
                  >
                    {isAI ? (
                      <Bot className="h-5 w-5 text-white" />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        isAI
                          ? "bg-white border border-gray-200"
                          : "bg-gradient-to-r from-green-500 to-green-600 text-white"
                      }`}
                    >
                      <p className={`text-sm whitespace-pre-wrap ${isAI ? "text-gray-800" : "text-white"}`}>
                        {message.content}
                      </p>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${isUser ? "text-right" : ""}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Coach AI anything..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Coach AI provides general fitness advice. Always consult healthcare professionals for medical concerns.
        </p>
      </div>
    </div>
  )
}

