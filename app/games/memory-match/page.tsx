import { Metadata } from 'next'
import MemoryMatchWithLevels from '@/components/games/memory-match-with-levels'

export const metadata: Metadata = {
  title: 'Memory Match Game with Levels - Test Your Memory | Mini Games',
  description: 'Play Memory Match game online for free with multiple difficulty levels. Flip cards and find matching pairs. Test and improve your memory skills!',
  keywords: 'memory match, memory game, card matching game, concentration game, pairs game, difficulty levels',
}

export default function MemoryMatchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MemoryMatchWithLevels />
    </div>
  )
}