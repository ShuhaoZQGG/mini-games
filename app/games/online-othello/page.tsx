import { Metadata } from 'next'
import OnlineOthello from '@/components/games/multiplayer/OnlineOthello'

export const metadata: Metadata = {
  title: 'Online Othello - Play Reversi Multiplayer | Mini Games Platform',
  description: 'Play Othello (Reversi) online! Flip your opponent\'s pieces, control the board, and master strategic gameplay in this classic multiplayer game.',
  keywords: ['online othello', 'reversi online', 'strategy game', 'multiplayer othello', 'board game', 'free othello'],
}

export default function OnlineOthelloPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineOthello />
    </div>
  )
}