import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bounce Physics - Physics Puzzle | Mini Games',
  description: 'Use physics to guide bouncing balls to targets. A puzzle game that combines physics, angles, and trajectory planning.',
  keywords: 'bounce physics, physics game, puzzle game, trajectory, angle game',
}

export default function BouncePhysicsPage() {
  return (
    <GamePlaceholder
      title="Bounce Physics"
      description="Use physics to guide bouncing balls to targets"
      category="Physics"
    />
  )
}