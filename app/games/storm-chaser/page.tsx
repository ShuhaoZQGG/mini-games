import { Metadata } from 'next'
import StormChaser from '@/components/games/storm-chaser'

export const metadata: Metadata = {
  title: 'Storm Chaser - Mini Games',
  description: 'Weather navigation and timing',
  keywords: ['storm chaser', 'mini game', 'online game'],
  openGraph: {
    title: 'Storm Chaser',
    description: 'Weather navigation and timing',
    type: 'website',
  },
}

export default function StormChaserPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <StormChaser />
    </div>
  )
}