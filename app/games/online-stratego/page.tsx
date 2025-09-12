import { Metadata } from 'next'
import OnlineStratego from '@/components/games/multiplayer/OnlineStratego'

export const metadata: Metadata = {
  title: 'Online Stratego - Military Strategy Game | Mini Games Platform',
  description: 'Play Stratego online! Deploy your army, capture the flag, and outsmart your opponent in this classic military strategy board game.',
  keywords: ['online stratego', 'strategy game', 'military game', 'multiplayer stratego', 'tactical game', 'free stratego'],
}

export default function OnlineStrategoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineStratego />
    </div>
  )
}