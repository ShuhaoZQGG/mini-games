import { Metadata } from 'next'
import ColorMatcher from '@/components/games/color-matcher'

export const metadata: Metadata = {
  title: 'Color Matcher - Match Colors Quickly | Mini Games',
  description: 'Test your color matching skills! Match colors quickly before time runs out. A fast-paced skill game to challenge your reflexes and color recognition.',
  keywords: ['color matcher', 'color game', 'skill game', 'reflex game', 'matching game', 'speed game'],
  openGraph: {
    title: 'Color Matcher - Match Colors Quickly',
    description: 'Test your color matching skills in this fast-paced game!',
    type: 'website',
  },
}

export default function ColorMatcherPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ColorMatcher />
    </div>
  )
}