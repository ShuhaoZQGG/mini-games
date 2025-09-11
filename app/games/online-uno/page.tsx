import { Metadata } from 'next'
import OnlineUno from '@/components/games/multiplayer/OnlineUno'

export const metadata: Metadata = {
  title: 'Online UNO - Play Free Multiplayer Card Game | Mini Games Platform',
  description: 'Play UNO online with friends! Match colors and numbers, use action cards strategically, and be the first to empty your hand in this classic multiplayer game.',
  keywords: ['online uno', 'multiplayer uno', 'card game', 'uno online', 'family game', 'free uno'],
}

export default function OnlineUnoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineUno />
    </div>
  )
}