import { Metadata } from 'next'
import BalloonPopPhysics from '@/components/games/balloon-pop-physics'

export const metadata: Metadata = {
  title: 'Balloon Pop Physics - Mini Games',
  description: 'Air pressure and wind physics',
  keywords: ['balloon pop physics', 'mini game', 'online game'],
  openGraph: {
    title: 'Balloon Pop Physics',
    description: 'Air pressure and wind physics',
    type: 'website',
  },
}

export default function BalloonPopPhysicsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BalloonPopPhysics />
    </div>
  )
}