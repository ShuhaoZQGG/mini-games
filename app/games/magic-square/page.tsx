import { Metadata } from 'next'
import MagicSquare from '@/components/games/puzzle/MagicSquare'

export const metadata: Metadata = {
  title: 'Magic Square - Number Puzzle Game | Mini Games Platform',
  description: 'Arrange numbers so each row, column, and diagonal sum to the same value. A classic mathematical puzzle challenge.',
  keywords: ['magic square', 'number puzzle', 'math game', 'logic puzzle', 'brain teaser', 'free magic square'],
}

export default function MagicSquarePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MagicSquare />
    </div>
  )
}