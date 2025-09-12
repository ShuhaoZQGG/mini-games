import { Metadata } from 'next'
import GearWorks from '@/components/games/gear-works'

export const metadata: Metadata = {
  title: 'Gear Works - Mini Games',
  description: 'Mechanical gear-fitting puzzles',
  keywords: ['gear works', 'mini game', 'online game'],
  openGraph: {
    title: 'Gear Works',
    description: 'Mechanical gear-fitting puzzles',
    type: 'website',
  },
}

export default function GearWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <GearWorks />
    </div>
  )
}