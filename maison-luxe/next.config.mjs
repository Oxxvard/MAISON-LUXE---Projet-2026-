/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cf.cjdropshipping.com',
      },
      {
        protocol: 'https',
        hostname: 'cbu01.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'oss-cf.cjdropshipping.com',
      },
      {
        protocol: 'https',
        hostname: 'img.cjdropshipping.com',
      },
      {
        protocol: 'https',
        hostname: 'img.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'ae01.alicdn.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85, 90, 95, 100],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimisation du bundler
  webpack: (config, { isServer }) => {
    if (!isServer && config.optimization?.splitChunks) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      };
    }

    // Suppress specific noisy webpack warnings coming from optional ESM dynamic requires
    config.ignoreWarnings = config.ignoreWarnings || [];
    // ignore opentelemetry dynamic require warning
    config.ignoreWarnings.push({ module: /@opentelemetry\/instrumentation/ });
    // ignore generic 'request of a dependency is an expression' warnings
    config.ignoreWarnings.push({ message: /the request of a dependency is an expression/i });

    return config;
  },
  // Headers pour la sécurité et performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: (
              () => {
                const parts = [
                  "default-src 'self'",
              // Scripts: Next.js inline/eval and Stripe
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              // Styles allow inline for Tailwind JIT and Next
                  "style-src 'self' 'unsafe-inline'",
              // Images: self, data/blob, et CDNs produits (Unsplash, CJ, AliCDN)
                  "img-src 'self' data: blob: https://images.unsplash.com https://cf.cjdropshipping.com https://oss-cf.cjdropshipping.com https://img.cjdropshipping.com https://cbu01.alicdn.com https://img.alicdn.com https://ae01.alicdn.com",
              // Fonts (local or data URIs)
                  "font-src 'self' data:",
              // XHR/fetch endpoints used by the app (Nominatim + Stripe API)
                  "connect-src 'self' https://nominatim.openstreetmap.org https://api.stripe.com",
              // Frames for Stripe Checkout
                  "frame-src https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com",
              // Forms restricted to self
                  "form-action 'self'",
              // Prevent this app from being embedded
                  "frame-ancestors 'none'",
              // Disallow base tag changes
                  "base-uri 'self'",
                ];

                // During development, allow GitHub.dev/Codespaces injected manifest for OAuth flows
                if (process.env.NODE_ENV !== 'production') {
                  parts.push("manifest-src 'self' https://github.dev");
                } else {
                  parts.push("manifest-src 'self'");
                }

                return parts.join('; ');
              }
            )(),
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
