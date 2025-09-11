import { Metadata } from 'next'
import PianoTiles from '@/components/games/piano-tiles'

export const metadata: Metadata = {
  title: 'Piano Tiles - Rhythm Music Game | Mini Games',
  description: 'Play Piano Tiles online! Tap falling tiles in rhythm as speed increases with each level. Test your reflexes and musical timing in this addictive rhythm game.',
  keywords: ['piano tiles', 'rhythm game', 'music game', 'tap game', 'reflex game', 'free music game'],
  openGraph: {
    title: 'Piano Tiles - Rhythm Music Game',
    description: 'Tap falling tiles in rhythm! Test your reflexes and musical timing in this addictive rhythm game.',
    type: 'website',
  },
}

export default function PianoTilesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PianoTiles />
    </div>
  )
}