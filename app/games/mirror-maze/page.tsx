import { Metadata } from 'next'
import MirrorMaze from '@/components/games/mirror-maze'

export const metadata: Metadata = {
  title: 'Mirror Maze - Mini Games',
  description: 'Light reflection and redirection',
  keywords: ['mirror maze', 'mini game', 'online game'],
  openGraph: {
    title: 'Mirror Maze',
    description: 'Light reflection and redirection',
    type: 'website',
  },
}

export default function MirrorMazePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MirrorMaze />
    </div>
  )
}