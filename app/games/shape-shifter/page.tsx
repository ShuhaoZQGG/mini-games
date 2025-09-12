import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shape Shifter - Transform & Navigate | Mini Games',
  description: 'Transform shapes to fit through obstacles. A puzzle game combining geometry and physics.',
  keywords: 'shape shifter, puzzle game, geometry, transformation, physics puzzle',
}

export default function ShapeShifterPage() {
  return (
    <GamePlaceholder
      title="Shape Shifter"
      description="Transform shapes to fit through obstacles"
      category="Puzzle"
    />
  )
}