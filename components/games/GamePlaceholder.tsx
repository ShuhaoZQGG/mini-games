'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Gamepad2, Construction } from 'lucide-react'
import Link from 'next/link'

interface GamePlaceholderProps {
  title: string
  description?: string
  category?: string
}

export default function GamePlaceholder({ 
  title, 
  description = 'This game is coming soon!',
  category = 'Game'
}: GamePlaceholderProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>
      </Link>

      <Card className="p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <Construction className="h-16 w-16 text-yellow-500" />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {description}
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <Gamepad2 className="h-12 w-12 text-yellow-600 dark:text-yellow-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Under Development
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300">
              Our team is working hard to bring you this exciting {category.toLowerCase()} game. 
              Check back soon for updates!
            </p>
          </div>
          
          <div className="pt-4">
            <Link href="/">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Browse Other Games
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}