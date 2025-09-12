import { Metadata } from 'next'
import MemorySequence from '@/components/games/memory-sequence'

export const metadata: Metadata = {
  title: 'Memory Sequence - Remember Complex Patterns | Mini Games',
  description: 'Test your memory with increasingly complex sequences! Remember and repeat patterns to advance through challenging levels.',
  keywords: ['memory sequence', 'memory game', 'pattern game', 'brain training', 'cognitive game', 'sequence memory'],
  openGraph: {
    title: 'Memory Sequence - Pattern Memory Challenge',
    description: 'Remember and repeat increasingly complex sequences!',
    type: 'website',
  },
}

export default function MemorySequencePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MemorySequence />
    </div>
  )
}