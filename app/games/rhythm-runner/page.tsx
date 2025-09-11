import { Metadata } from 'next'
import RhythmRunner from '@/components/games/rhythm-runner'

export const metadata: Metadata = {
  title: 'Rhythm Runner - Mini Games',
  description: 'Platformer synchronized to music beats',
  keywords: ['rhythm runner', 'mini game', 'online game'],
  openGraph: {
    title: 'Rhythm Runner',
    description: 'Platformer synchronized to music beats',
    type: 'website',
  },
}

export default function RhythmRunnerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RhythmRunner />
    </div>
  )
}