import { Metadata } from 'next'
import FingerDance from '@/components/games/finger-dance'

export const metadata: Metadata = {
  title: 'Finger Dance - Mini Games',
  description: 'Multi-touch coordination game',
  keywords: ['finger dance', 'mini game', 'online game'],
  openGraph: {
    title: 'Finger Dance',
    description: 'Multi-touch coordination game',
    type: 'website',
  },
}

export default function FingerDancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FingerDance />
    </div>
  )
}