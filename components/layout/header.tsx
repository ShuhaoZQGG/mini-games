'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b">
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">MiniGames</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/games" className="hover:text-primary transition-colors">
              All Games
            </Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">
              Leaderboard
            </Link>
            <Link href="/about" className="hover:text-primary transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <Link href="/games" className="hover:text-primary transition-colors">
                All Games
              </Link>
              <Link href="/leaderboard" className="hover:text-primary transition-colors">
                Leaderboard
              </Link>
              <Link href="/about" className="hover:text-primary transition-colors">
                About
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}