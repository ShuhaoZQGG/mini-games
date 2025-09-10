import { Metadata } from 'next'
import { BubbleShooterWithLevels } from '@/components/games/BubbleShooter'

export const metadata: Metadata = {
  title: 'Bubble Shooter Game with Levels - Match 3 Puzzle | Mini Games',
  description: 'Play Bubble Shooter online for free with multiple difficulty levels. Shoot and match 3+ bubbles of the same color. Features physics-based gameplay and wall bouncing!',
  keywords: 'bubble shooter, match 3, bubble pop, physics game, puzzle game, arcade game, difficulty levels',
}

export default function BubbleShooterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BubbleShooterWithLevels />
    </div>
  )
}