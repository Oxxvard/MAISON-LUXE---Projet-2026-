import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.0.0',
    deployTime: new Date().toISOString(),
    commitMessage: 'shipping accepte any type - version 2.0.0',
    features: {
      checkoutV2: true,
      shippingAnyType: true,
      debugEndpoints: true,
    }
  });
}
