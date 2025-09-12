import { Metadata } from 'next'
import KenKen from '@/components/games/puzzle/KenKen'

export const metadata: Metadata = {
  title: 'KenKen - Mathematical Logic Puzzle | Mini Games Platform',
  description: 'Solve arithmetic puzzles using logic and math operations. Fill the grid following mathematical clues in this brain-training game.',
  keywords: ['kenken', 'math puzzle', 'arithmetic game', 'logic puzzle', 'brain training', 'free kenken'],
}

export default function KenKenPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <KenKen />
    </div>
  )
}