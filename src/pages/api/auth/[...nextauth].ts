import { query as q } from "faunadb";

import { fauna } from "./../../../services/fauna";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    // ...add more providers here
  ],
  secret: process.env.SIGNING_KEY,
  callbacks: {
    async signIn({ user, account, profile }) {
      const { id, displayName, email } = user;
      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index("users_by_email"),
                  q.Casefold(user.email as string)
                )
              )
            ),
            q.Create(q.Collection("users"), { data: { email } }),
            q.Get(
              q.Match(
                q.Index("users_by_email"),
                q.Casefold(user.email as string)
              )
            )
          )
        );

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    async session({ session }) {
      try {
        const userActiveSubscription = await fauna.query(
          q.Get(
            q.Intersection(
              q.Match(
                q.Index("subscription_by_user_ref"),
                q.Select(
                  "ref",
                  q.Get(
                    q.Match(
                      q.Index("users_by_email"),
                      q.Casefold(session.user.email)
                    )
                  )
                )
              ),
              q.Match(q.Index("subscription_by_status"), "active")
            )
          )
        );
        return {
          ...session,
          activeSubscription: userActiveSubscription,
        };
      } catch {
        return {
          ...session,
          activeSubscription: null,
        };
      }
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      return token;
    },
  },
});