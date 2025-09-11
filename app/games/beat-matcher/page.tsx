import { Metadata } from 'next'
import BeatMatcher from '@/components/games/beat-matcher'

export const metadata: Metadata = {
  title: 'Beat Matcher - Circular Rhythm Game | Mini Games',
  description: 'Match beats to music patterns on a circular rhythm wheel. Test your timing and build streaks in this addictive rhythm game.',
  keywords: ['beat matcher', 'rhythm game', 'music game', 'timing game', 'circular rhythm', 'beat matching'],
  openGraph: {
    title: 'Beat Matcher - Circular Rhythm Game',
    description: 'Match beats to music patterns! Test your timing on the circular rhythm wheel.',
    type: 'website',
  },
}

export default function BeatMatcherPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BeatMatcher />
    </div>
  )
}