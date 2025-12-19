/**
 * Validation des variables d'environnement au démarrage
 * Garanti que tous les secrets requis sont définis
 */

export interface EnvConfig {
  // Database
  MONGODB_URI: string;

  // NextAuth
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  // Stripe
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // Email (Resend)
  RESEND_API_KEY?: string;

  // CJ Dropshipping
  CJ_SHOP_ID?: string;
  CJ_API_KEY?: string;
  CJ_WEBHOOK_SECRET?: string;

  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL?: string;

  // Rate limiting
  RATE_LIMIT_ENABLED?: boolean;

  // Cron
  CRON_SECRET?: string;
}

/**
 * Lister les variables requises
 */
import logger from '@/lib/logger';
import { captureException } from '@/lib/sentry';


const REQUIRED_VARS = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

/**
 * Valider les env vars
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = [];

  REQUIRED_VARS.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    // Log error and list missing vars via centralized logger
    logger.error('❌ Variables d\'environnement manquantes:', { missing });
    captureException(new Error('Missing environment variables'), { missing });
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  // Validations supplémentaires
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error('NODE_ENV doit être: development, production ou test');
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY invalide (doit commencer par sk_)');
  }

  if (process.env.STRIPE_PUBLISHABLE_KEY && !process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    throw new Error('STRIPE_PUBLISHABLE_KEY invalide (doit commencer par pk_)');
  }

  // Log presence of optional external keys to help debugging
  logger.info('✅ Environment validated');
  if (!process.env.CJ_API_KEY) logger.warn('CJ_API_KEY is not set; CJ integration will fail at runtime if used');
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) logger.warn('Google OAuth keys are not fully configured');
  if (!process.env.NEXTAUTH_URL) logger.warn('NEXTAUTH_URL is not set');

  return {
    MONGODB_URI: process.env.MONGODB_URI!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CJ_SHOP_ID: process.env.CJ_SHOP_ID,
    CJ_API_KEY: process.env.CJ_API_KEY,
    CJ_WEBHOOK_SECRET: process.env.CJ_WEBHOOK_SECRET,
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
    CRON_SECRET: process.env.CRON_SECRET,
  };
}

// Valider au démarrage
let config: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!config) {
    config = validateEnv();
  }
  return config;
}
