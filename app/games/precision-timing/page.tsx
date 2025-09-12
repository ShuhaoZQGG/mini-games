import { Metadata } from 'next'
import PrecisionTiming from '@/components/games/precision-timing'

export const metadata: Metadata = {
  title: 'Precision Timing - Mini Games',
  description: 'Multi-layered timing challenges',
  keywords: ['precision timing', 'mini game', 'online game'],
  openGraph: {
    title: 'Precision Timing',
    description: 'Multi-layered timing challenges',
    type: 'website',
  },
}

export default function PrecisionTimingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PrecisionTiming />
    </div>
  )
}