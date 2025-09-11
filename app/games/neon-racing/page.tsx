import { Metadata } from 'next'
import NeonRacing from '@/components/games/neon-racing'

export const metadata: Metadata = {
  title: 'Neon Racing - Mini Games',
  description: 'Tron-style racing with power-ups',
  keywords: ['neon racing', 'mini game', 'online game'],
  openGraph: {
    title: 'Neon Racing',
    description: 'Tron-style racing with power-ups',
    type: 'website',
  },
}

export default function NeonRacingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <NeonRacing />
    </div>
  )
}