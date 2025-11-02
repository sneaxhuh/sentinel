import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.githubId = profile?.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.githubUsername = (profile as any)?.login
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          githubId: token.githubId as string,
          githubUsername: token.githubUsername as string,
        }
      }
    },
  },
  pages: {
    signIn: '/onboarding',
  },
  trustHost: true,
})