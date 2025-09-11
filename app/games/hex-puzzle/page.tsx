import { Metadata } from 'next'
import HexPuzzle from '@/components/games/puzzle/HexPuzzle'

export const metadata: Metadata = {
  title: 'Hex Puzzle - Hexagonal Block Game | Mini Games Platform',
  description: 'Fit hexagonal pieces into the grid to clear lines! A unique twist on block puzzles with hexagonal gameplay.',
  keywords: ['hex puzzle', 'hexagon game', 'block puzzle', 'tetris variant', 'puzzle game', 'free hex game'],
}

export default function HexPuzzlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <HexPuzzle />
    </div>
  )
}