import { Metadata } from 'next'
import OnlineBattleshipII from '@/components/games/multiplayer/OnlineBattleshipII'

export const metadata: Metadata = {
  title: 'Online Battleship II - Advanced Naval Combat | Mini Games Platform',
  description: 'Play enhanced Battleship online! Deploy your fleet, use special abilities, and sink enemy ships in this strategic multiplayer naval combat game.',
  keywords: ['online battleship', 'naval strategy', 'multiplayer battleship', 'fleet combat', 'strategy game', 'free battleship'],
}

export default function OnlineBattleshipIIPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineBattleshipII />
    </div>
  )
}