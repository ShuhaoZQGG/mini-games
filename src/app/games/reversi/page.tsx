import { Metadata } from 'next'
import { ReversiGame } from '@/components/games/reversi/reversi-game'

export const metadata: Metadata = {
  title: 'Reversi (Othello) | Mini Games',
  description: 'Play Reversi online - Classic strategy board game with disc flipping mechanics'
}

export default function ReversiPage() {
  return (
    <div className="container mx-auto py-8">
      <ReversiGame />
    </div>
  )
}