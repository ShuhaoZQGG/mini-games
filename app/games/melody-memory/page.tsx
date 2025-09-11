import { Metadata } from 'next'
import MelodyMemory from '@/components/games/melody-memory'

export const metadata: Metadata = {
  title: 'Melody Memory - Musical Sequence Game | Mini Games',
  description: 'Remember and replay musical sequences in this challenging memory game. Test your musical memory with increasing difficulty levels.',
  keywords: ['melody memory', 'music game', 'memory game', 'sequence game', 'musical notes', 'rhythm memory'],
  openGraph: {
    title: 'Melody Memory - Musical Sequence Game',
    description: 'Remember and replay musical sequences! Test your musical memory skills.',
    type: 'website',
  },
}

export default function MelodyMemoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MelodyMemory />
    </div>
  )
}