
import NextAuth, { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.NEXT_PUBLIC_X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.x_username = (profile as any).data?.username || (profile as any).username
        token.x_uid = (profile as any).data?.id || (profile as any).id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.x_username = token.x_username as string
        session.user.x_uid = token.x_uid as string
      }
      return session
    },
  },
  pages: {
    signIn: '/identity',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
