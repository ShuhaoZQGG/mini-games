import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { PWAInstall } from '@/components/pwa-install'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mini Games - Play Free Online Games',
  description: 'Play exciting mini-games online for free. CPS Test, Memory Match, Typing Speed Test, and more. No registration required!',
  keywords: 'mini games, online games, free games, cps test, typing test, memory game',
  openGraph: {
    title: 'Mini Games - Play Free Online Games',
    description: 'Play exciting mini-games online for free',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mini Games',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <Toaster />
          <PWAInstall />
        </ThemeProvider>
      </body>
    </html>
  )
}