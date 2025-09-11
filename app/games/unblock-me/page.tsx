import { Metadata } from 'next'
import UnblockMe from '@/components/games/puzzle/UnblockMe'

export const metadata: Metadata = {
  title: 'Unblock Me - Sliding Block Puzzle | Mini Games Platform',
  description: 'Free the red block by sliding other blocks out of the way! Solve increasingly challenging puzzles in this brain-teasing game.',
  keywords: ['unblock me', 'sliding puzzle', 'block puzzle', 'logic game', 'brain teaser', 'free puzzle'],
}

export default function UnblockMePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <UnblockMe />
    </div>
  )
}