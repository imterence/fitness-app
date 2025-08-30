import type { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          console.log("Auth - Attempting to authorize user:", credentials.email)
          
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              clientProfile: true,
              clients: true,
            }
          })
          
          if (!user) {
            console.log("Auth - User not found:", credentials.email)
            return null
          }

          console.log("Auth - User found:", { id: user.id, email: user.email, role: user.role })

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            console.log("Auth - Invalid password for user:", credentials.email)
            return null
          }

          console.log("Auth - Password verified, returning user data")

          // Return user data for session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: { role: string; id: string } | undefined }) {
      console.log("JWT Callback - Token:", token, "User:", user)
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      console.log("JWT Callback - Final token:", token)
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log("Session Callback - Session:", session, "Token:", token)
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      console.log("Session Callback - Final session:", session)
      return session
    }
  },
  pages: {
    signIn: "/auth/login"
  },
  session: {
    strategy: "jwt" as const
  },
  debug: process.env.NODE_ENV === "development"
}
