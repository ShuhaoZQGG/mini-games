import { Metadata } from 'next'
import { MemoryMatchComponent } from '@/components/games/memory-match'

export const metadata: Metadata = {
  title: 'Memory Match Game - Test Your Memory | Mini Games',
  description: 'Play Memory Match game online for free. Flip cards and find matching pairs. Test and improve your memory skills!',
  keywords: 'memory match, memory game, card matching game, concentration game, pairs game',
}

export default function MemoryMatchPage() {
  return (
    <div className="container-responsive py-8">
      <MemoryMatchComponent />
    </div>
  )
}