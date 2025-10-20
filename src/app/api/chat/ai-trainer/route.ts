import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// AI Trainer System Prompt
const AI_TRAINER_SYSTEM_PROMPT = `You are an expert fitness trainer and Hyrox coach named "Coach AI". Your role is to:

1. Provide personalized fitness advice and workout recommendations
2. Answer questions about exercise form, nutrition, and training plans
3. Motivate and encourage users in their fitness journey
4. Give specific advice about Hyrox training and competition preparation
5. Be friendly, professional, and supportive

Guidelines:
- Keep responses concise and actionable (2-4 paragraphs max)
- Always prioritize safety and proper form
- Recommend consulting healthcare professionals for medical issues
- Be encouraging and positive
- Use fitness terminology but explain complex terms
- Provide specific examples when giving advice

Remember: You're a supportive coach, not just an information provider. Show enthusiasm and care about the user's progress!`

// POST /api/chat/ai-trainer - Send message to AI trainer and get response
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, conversationHistory = [] } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const userId = session.user.id
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn("OPENAI_API_KEY not configured. Using mock response.")
      return mockAIResponse(userId, message)
    }

    // Call OpenAI API
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or "gpt-3.5-turbo" for lower cost
          messages: [
            {
              role: "system",
              content: AI_TRAINER_SYSTEM_PROMPT
            },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("OpenAI API error:", error)
        throw new Error("AI service unavailable")
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again."

      // Get or create AI trainer conversation for this user
      const aiTrainerUser = await getOrCreateAITrainerUser()
      const conversation = await getOrCreateAIConversation(userId, aiTrainerUser.id)

      // Save both user message and AI response to database
      const userMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          content: message,
          messageType: "TEXT",
          isRead: true // User's own message is already "read"
        }
      })

      const aiMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: aiTrainerUser.id,
          content: aiResponse,
          messageType: "TEXT",
          isRead: false // AI response starts as unread
        }
      })

      return NextResponse.json({
        userMessage,
        aiMessage,
        response: aiResponse
      })
    } catch (aiError) {
      console.error("Error calling AI service:", aiError)
      return mockAIResponse(userId, message)
    }

  } catch (error) {
    console.error("Error in AI trainer chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/chat/ai-trainer - Get AI trainer conversation history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get AI trainer user and conversation
    const aiTrainerUser = await getOrCreateAITrainerUser()
    const conversation = await getOrCreateAIConversation(userId, aiTrainerUser.id)

    // Get messages for this user's AI trainer conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 100 // Last 100 messages
    })

    // Transform messages to include sender info
    const formattedMessages = messages.map(msg => ({
      ...msg,
      sender: msg.senderId === aiTrainerUser.id
        ? { id: aiTrainerUser.id, name: "Coach AI", role: "AI_TRAINER" }
        : { id: userId, name: session.user.name, role: session.user.role }
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error("Error fetching AI trainer messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper: Get or create AI trainer bot user
async function getOrCreateAITrainerUser() {
  const AI_TRAINER_EMAIL = "ai-trainer@system.internal"
  
  let aiUser = await prisma.user.findUnique({
    where: { email: AI_TRAINER_EMAIL }
  })

  if (!aiUser) {
    aiUser = await prisma.user.create({
      data: {
        email: AI_TRAINER_EMAIL,
        name: "Coach AI",
        password: "no-login", // AI bot doesn't need to login
        role: "TRAINER"
      }
    })
  }

  return aiUser
}

// Helper: Get or create AI conversation for a user
async function getOrCreateAIConversation(userId: string, aiTrainerId: string) {
  let conversation = await prisma.conversation.findUnique({
    where: {
      clientId_trainerId: {
        clientId: userId,
        trainerId: aiTrainerId
      }
    }
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        clientId: userId,
        trainerId: aiTrainerId
      }
    })
  }

  return conversation
}

// Mock AI Response (fallback when API key not configured)
async function mockAIResponse(userId: string, message: string) {
  const mockResponses = [
    "Great question! For optimal Hyrox performance, I recommend focusing on a mix of strength and endurance training. Try incorporating interval runs, sled pushes, and farmers carries into your weekly routine. Remember, consistency is key! 💪",
    
    "I love your enthusiasm! Start with a solid foundation: 3-4 days of training per week, mixing cardio with functional strength exercises. Don't forget to include rest days for recovery. What specific area would you like to focus on first?",
    
    "That's a common challenge! For improving your endurance, try progressive overload: gradually increase your workout duration or intensity each week. Stay hydrated and fuel properly before and after workouts. You've got this! 🔥",
    
    "Safety first! Always warm up for 5-10 minutes before intense exercise and cool down afterwards. Focus on proper form rather than heavy weights when starting out. If something doesn't feel right, listen to your body and adjust accordingly.",
    
    "Excellent progress! Keep up the momentum by tracking your workouts and celebrating small wins. Remember, fitness is a journey, not a destination. Stay consistent, stay positive, and the results will follow! 🎯"
  ]

  const response = mockResponses[Math.floor(Math.random() * mockResponses.length)]

  // Get AI trainer user and conversation
  const aiTrainerUser = await getOrCreateAITrainerUser()
  const conversation = await getOrCreateAIConversation(userId, aiTrainerUser.id)

  // Save mock conversation to database
  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: userId,
      content: message,
      messageType: "TEXT",
      isRead: true
    }
  })

  const aiMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: aiTrainerUser.id,
      content: response + "\n\n_Note: AI trainer is in demo mode. Add your OpenAI API key to enable full AI responses._",
      messageType: "TEXT",
      isRead: false
    }
  })

  return NextResponse.json({
    userMessage,
    aiMessage,
    response: aiMessage.content,
    isDemoMode: true
  })
}

