import { Metadata } from 'next'
import { AirHockeyGame } from '@/components/games/air-hockey/air-hockey-game'

export const metadata: Metadata = {
  title: 'Air Hockey | Mini Games',
  description: 'Play Air Hockey online - Fast-paced arcade game with real-time multiplayer'
}

export default function AirHockeyPage() {
  return (
    <div className="container mx-auto py-8">
      <AirHockeyGame />
    </div>
  )
}