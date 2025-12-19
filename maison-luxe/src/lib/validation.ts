import { NextResponse, NextRequest } from 'next/server';
import { ZodTypeAny } from 'zod';
import { errorResponse } from '@/lib/errors';
import logger from '@/lib/logger';
import { captureException } from '@/lib/sentry';

// Wrapper pour valider le body d'une requête avec Zod.
// handler reçoit (request, session, validatedData, ctx?)
export function withBodyValidation(schema: ZodTypeAny, handler: (request: NextRequest, session: any, data: any, ctx?: any) => Promise<any> | any) {
  return async (request: NextRequest, session: any, ctx?: any) => {
    try {
      const body = await request.json();
      const validation = schema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          errorResponse('VALIDATIONerror', 'Données invalides', validation.error.format()),
          { status: 400 }
        );
      }

      return await handler(request, session, validation.data, ctx);
    } catch (err: any) {
      logger.error('Validation error wrapper:', err);
      captureException(err, { route: 'withBodyValidation' });
      return NextResponse.json(
        errorResponse('VALIDATIONerror', err.message || 'Erreur de validation'),
        { status: 400 }
      );
    }
  };
}
