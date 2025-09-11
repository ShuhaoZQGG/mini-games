import { Metadata } from 'next'
import RubiksCube from '@/components/games/puzzle/RubiksCube'

export const metadata: Metadata = {
  title: 'Rubik\'s Cube - 3D Puzzle Solver | Mini Games Platform',
  description: 'Solve the classic Rubik\'s Cube online! Rotate faces, match colors, and challenge yourself with this iconic 3D puzzle game.',
  keywords: ['rubiks cube', '3d puzzle', 'cube solver', 'brain game', 'logic puzzle', 'free rubiks cube'],
}

export default function RubiksCubePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RubiksCube />
    </div>
  )
}