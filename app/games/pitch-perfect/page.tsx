import { Metadata } from 'next'
import PitchPerfect from '@/components/games/pitch-perfect'

export const metadata: Metadata = {
  title: 'Pitch Perfect - Mini Games',
  description: 'Identify musical notes and intervals',
  keywords: ['pitch perfect', 'mini game', 'online game'],
  openGraph: {
    title: 'Pitch Perfect',
    description: 'Identify musical notes and intervals',
    type: 'website',
  },
}

export default function PitchPerfectPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PitchPerfect />
    </div>
  )
}