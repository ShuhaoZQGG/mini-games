import { Metadata } from 'next'
import OnlineDominoes from '@/components/games/multiplayer/OnlineDominoes'

export const metadata: Metadata = {
  title: 'Online Dominoes - Play Free Multiplayer | Mini Games Platform',
  description: 'Play Dominoes online with friends! Match tiles, block opponents, and be the first to play all your dominoes in this classic strategy game.',
  keywords: ['online dominoes', 'multiplayer dominoes', 'tile game', 'strategy game', 'classic game', 'free dominoes'],
}

export default function OnlineDominoesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineDominoes />
    </div>
  )
}