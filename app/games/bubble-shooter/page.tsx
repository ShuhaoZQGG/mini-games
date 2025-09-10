import { Metadata } from 'next'
import BubbleShooter from '@/components/games/BubbleShooter'

export const metadata: Metadata = {
  title: 'Bubble Shooter | Mini Games Platform',
  description: 'Play Bubble Shooter - Match 3 or more bubbles to clear them. Physics-based arcade fun!',
  keywords: 'bubble shooter, arcade game, puzzle, physics game, match 3',
}

export default function BubbleShooterPage() {
  return (
    <div className="container-responsive py-8">
      <BubbleShooter />
    </div>
  )
}