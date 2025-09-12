import { Metadata } from 'next'
import MarbleMaze from '@/components/games/marble-maze'

export const metadata: Metadata = {
  title: 'Marble Maze - Mini Games',
  description: 'Tilt-controlled marble navigation',
  keywords: ['marble maze', 'mini game', 'online game'],
  openGraph: {
    title: 'Marble Maze',
    description: 'Tilt-controlled marble navigation',
    type: 'website',
  },
}

export default function MarbleMazePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MarbleMaze />
    </div>
  )
}