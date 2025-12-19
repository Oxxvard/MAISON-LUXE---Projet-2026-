/**
 * Middleware d'authentification strict
 * Protège les routes admin et contrôle les accès
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createError, errorResponse } from '@/lib/errors';
import logger from '@/lib/logger';
import { captureException } from '@/lib/sentry';

/**
 * Type pour session sécurisée
 */
export interface SecureSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

/**
 * Middleware pour vérifier l'authentification
 */
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      errorResponse('UNAUTHORIZED', 'Non authentifié'),
      { status: 401 }
    );
  }

  return { session: session as any as SecureSession };
}

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
export async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      errorResponse('UNAUTHORIZED', 'Non authentifié'),
      { status: 401 }
    );
  }

  // @ts-ignore - role peut être undefined dans NextAuth par défaut
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      errorResponse('FORBIDDEN', 'Accès admin requis'),
      { status: 403 }
    );
  }

  return { session: session as any as SecureSession };
}

/**
 * Helper pour vérifier les permissions dans les routes
 */
export function withAuth<T>(
  handler: (req: NextRequest, session: SecureSession, ctx?: any) => Promise<T>
) {
  return async (...args: any[]) => {
    const request: NextRequest = args[0];
    const ctx = args[1];
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    try {
      return await handler(request, authResult.session, ctx);
    } catch (error: any) {
      logger.error('Erreur dans route protégée:', error);
      captureException(error, { route: 'withAuth' });
      return NextResponse.json(
        errorResponse('INTERNALerror', error.message),
        { status: 500 }
      );
    }
  };
}

/**
 * Helper pour vérifier les permissions admin
 */
export function withAdminAuth<T>(
  handler: (req: NextRequest, session: SecureSession, ctx?: any) => Promise<T>
) {
  return async (...args: any[]) => {
    const request: NextRequest = args[0];
    const ctx = args[1];
    const authResult = await requireAdmin(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    try {
      return await handler(request, authResult.session, ctx);
    } catch (error: any) {
      logger.error('Erreur dans route admin:', error);
      captureException(error, { route: 'withAdminAuth' });
      return NextResponse.json(
        errorResponse('INTERNALerror', error.message),
        { status: 500 }
      );
    }
  };
}
