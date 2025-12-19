import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Initialize client-side Sentry (if configured)
import '../../sentry.client.config';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://maisonluxe.com'),
  title: {
    default: 'MaisonLuxe - Boutique de Luxe en Ligne',
    template: '%s | MaisonLuxe'
  },
  description: "Découvrez notre collection exclusive de produits de luxe haut de gamme. Livraison gratuite, paiement sécurisé et service client d'exception.",
  keywords: ['luxe', 'produits premium', 'boutique en ligne', 'e-commerce', 'high-end', 'qualité'],
  authors: [{ name: 'MaisonLuxe' }],
  creator: 'MaisonLuxe',
  publisher: 'MaisonLuxe',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://maisonluxe.com',
    title: 'MaisonLuxe - Boutique de Luxe en Ligne',
    description: "Découvrez notre collection exclusive de produits de luxe haut de gamme.",
    siteName: 'MaisonLuxe',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MaisonLuxe - Boutique de Luxe en Ligne',
    description: "Découvrez notre collection exclusive de produits de luxe haut de gamme.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification_token',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <Toaster 
            position="top-center"
            gutter={12}
            toastOptions={{
              duration: 3500,
              className: '',
              style: {
                marginTop: '80px',
                background: '#fff',
                color: '#1f2937',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '500',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                maxWidth: '500px',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#047857',
                  border: '1px solid #10b981',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#dc2626',
                  border: '1px solid #ef4444',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
