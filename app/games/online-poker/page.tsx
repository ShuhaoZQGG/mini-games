import { Metadata } from 'next'
import OnlinePoker from '@/components/games/multiplayer/OnlinePoker'

export const metadata: Metadata = {
  title: 'Online Poker - Play Free Multiplayer Poker | Mini Games Platform',
  description: 'Play Texas Hold\'em poker online with friends! Join multiplayer tables, test your strategy, and compete for the pot in this classic card game.',
  keywords: ['online poker', 'texas holdem', 'multiplayer poker', 'card game', 'poker strategy', 'free poker'],
}

export default function OnlinePokerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlinePoker />
    </div>
  )
}