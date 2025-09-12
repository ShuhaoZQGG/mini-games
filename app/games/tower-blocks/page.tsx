import { Metadata } from 'next'
import TowerBlocks from '@/components/games/puzzle/TowerBlocks'

export const metadata: Metadata = {
  title: 'Tower Blocks - Stack Building Puzzle | Mini Games Platform',
  description: 'Build the tallest tower by stacking blocks perfectly! Test your timing and precision in this addictive puzzle game.',
  keywords: ['tower blocks', 'stacking game', 'building puzzle', 'timing game', 'precision game', 'free tower game'],
}

export default function TowerBlocksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TowerBlocks />
    </div>
  )
}