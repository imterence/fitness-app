import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    role: string
    clients?: any[]
    trainerId?: string
    clientProfile?: any
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      clients?: any[]
      trainerId?: string
      clientProfile?: any
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    clients?: any[]
    trainerId?: string
    clientProfile?: any
  }
}

declare module "next-auth/react" {
  export function useSession(): {
    data: Session | null
    status: "loading" | "authenticated" | "unauthenticated"
  }
  
  export function signIn(provider: string, options?: any): Promise<any>
  export function signOut(options?: any): Promise<any>
  export function getSession(): Promise<Session | null>
}

