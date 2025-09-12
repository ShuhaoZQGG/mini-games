import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Color Flood Game - Fill the Board | Mini Games',
  description: 'Fill the entire board with one color in limited moves. A strategic puzzle game that tests your planning skills.',
  keywords: 'color flood, puzzle game, flood fill, strategy game, color puzzle',
}

export default function ColorFloodPage() {
  return (
    <GamePlaceholder
      title="Color Flood"
      description="Fill the board with one color in limited moves"
      category="Puzzle"
    />
  )
}