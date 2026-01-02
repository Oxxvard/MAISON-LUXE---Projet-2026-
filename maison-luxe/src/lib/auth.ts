import { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import logger from '@/lib/logger';

type AugmentedUser = {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  sub?: string;
};

type AugmentedToken = Record<string, unknown> & {
  id?: string;
  role?: string;
};

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('Email ou mot de passe incorrect');
        }

        if (!user.password) {
          // Compte créé via OAuth — pas de mot de passe local
          throw new Error('Utilisateur OAuth, pas de mot de passe local');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Email ou mot de passe incorrect');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.email,
          email: profile.email,
          image: profile.picture,
          role: 'user',
        };
      },
    })
  );
} else {
  logger.info('Google OAuth not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET)');
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn(params) {
      const { user, account } = params as { user: AugmentedUser; account?: { provider?: string } | null };
      if (account?.provider === 'google') {
        await dbConnect();
        const existing = await User.findOne({ email: user.email });

        if (!existing) {
          const created = await User.create({
            name: user.name || user.email || 'Utilisateur',
            email: user.email!,
            password: '',
            role: 'user',
          });
          user.role = created.role;
          user.id = created._id.toString();
        } else {
          user.role = existing.role;
          user.id = existing._id.toString();
        }
      }
      return true;
    },
    async jwt(params) {
      const { token, user } = params as { token: AugmentedToken; user?: AugmentedUser };
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session(params) {
      const { session, token } = params as { session: DefaultSession; token: AugmentedToken };
      if (session.user) {
        const sUser = session.user as DefaultSession['user'] & { role?: string; id?: string };
        sUser.role = token.role as string | undefined;
        sUser.id = token.id as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  // Activer le debug en dev pour obtenir plus d'informations sur les erreurs client/server
  debug: process.env.NODE_ENV !== 'production',
  secret: process.env.NEXTAUTH_SECRET,
};
