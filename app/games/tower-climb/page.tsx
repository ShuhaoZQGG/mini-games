import { Metadata } from 'next'
import TowerClimb from '@/components/games/action/TowerClimb'

export const metadata: Metadata = {
  title: 'Tower Climb - Vertical Platform Game | Mini Games Platform',
  description: 'Climb an endless tower, avoiding obstacles and enemies! Jump between platforms in this challenging vertical action game.',
  keywords: ['tower climb', 'platform game', 'climbing game', 'action game', 'vertical game', 'free tower game'],
}

export default function TowerClimbPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TowerClimb />
    </div>
  )
}