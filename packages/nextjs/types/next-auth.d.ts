import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      githubId?: string
      githubUsername?: string
    } & DefaultSession["user"]
  }

  interface JWT {
    accessToken?: string
    githubId?: string
    githubUsername?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    githubId?: string 
    githubUsername?: string
  }
}