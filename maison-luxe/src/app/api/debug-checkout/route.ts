import { NextResponse, NextRequest } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Vérifier la session
    const session = await getServerSession(authOptions);
    
    logger.info('🔍 Debug checkout - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user ? (session.user as any).id : null,
    });

    // Lire le body
    let body;
    try {
      body = await request.json();
      logger.info('🔍 Debug checkout - Body received:', {
        bodyKeys: Object.keys(body),
        itemsCount: body.items?.length,
        hasOrderId: !!body.orderId,
        hasShipping: !!body.shipping,
      });
    } catch (e: any) {
      logger.error('❌ Debug checkout - Failed to parse body:', e.message);
      return NextResponse.json({
        error: 'Invalid JSON',
        message: e.message,
      }, { status: 400 });
    }

    // Retourner les infos de debug
    return NextResponse.json({
      success: true,
      debug: {
        session: {
          hasSession: !!session,
          hasUser: !!session?.user,
          user: session?.user ? {
            id: (session.user as any).id,
            email: session.user.email,
          } : null,
        },
        body: {
          keys: Object.keys(body),
          itemsCount: body.items?.length,
          orderId: body.orderId,
          shippingName: body.shipping?.name,
        },
        env: {
          hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
          hasMongoUri: !!process.env.MONGODB_URI,
          nodeEnv: process.env.NODE_ENV,
        },
      },
    });
  } catch (error: any) {
    logger.error('❌ Debug checkout error:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    });
    
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}
