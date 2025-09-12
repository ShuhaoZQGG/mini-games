import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rhythm Tap - Beat Matching Game | Mini Games',
  description: 'Tap to the beat and maintain rhythm. A music game that tests your timing and rhythm skills.',
  keywords: 'rhythm tap, music game, beat matching, rhythm game, timing game',
}

export default function RhythmTapPage() {
  return (
    <GamePlaceholder
      title="Rhythm Tap"
      description="Tap to the beat and maintain rhythm"
      category="Music"
    />
  )
}