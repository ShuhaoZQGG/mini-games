import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Memory Grid - Pattern Memory Game | Mini Games',
  description: 'Remember and reproduce grid patterns. A brain training game that enhances visual memory and pattern recognition.',
  keywords: 'memory grid, memory game, pattern memory, brain training, visual memory',
}

export default function MemoryGridPage() {
  return (
    <GamePlaceholder
      title="Memory Grid"
      description="Remember and reproduce grid patterns"
      category="Memory"
    />
  )
}