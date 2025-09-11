import { Metadata } from 'next'
import RocketDodge from '@/components/games/rocket-dodge'

export const metadata: Metadata = {
  title: 'Rocket Dodge - Mini Games',
  description: 'Space debris avoidance with upgrades',
  keywords: ['rocket dodge', 'mini game', 'online game'],
  openGraph: {
    title: 'Rocket Dodge',
    description: 'Space debris avoidance with upgrades',
    type: 'website',
  },
}

export default function RocketDodgePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RocketDodge />
    </div>
  )
}