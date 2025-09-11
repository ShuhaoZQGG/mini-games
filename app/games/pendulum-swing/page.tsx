import { Metadata } from 'next'
import PendulumSwing from '@/components/games/pendulum-swing'

export const metadata: Metadata = {
  title: 'Pendulum Swing - Mini Games',
  description: 'Physics-based swinging mechanics',
  keywords: ['pendulum swing', 'mini game', 'online game'],
  openGraph: {
    title: 'Pendulum Swing',
    description: 'Physics-based swinging mechanics',
    type: 'website',
  },
}

export default function PendulumSwingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PendulumSwing />
    </div>
  )
}