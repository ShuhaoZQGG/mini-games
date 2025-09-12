import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dodge Master - Obstacle Avoidance | Mini Games',
  description: 'Master the art of dodging obstacles. An intense action game that tests your reflexes and survival skills.',
  keywords: 'dodge master, action game, reflex game, obstacle avoidance, survival game',
}

export default function DodgeMasterPage() {
  return (
    <GamePlaceholder
      title="Dodge Master"
      description="Master the art of dodging obstacles"
      category="Action"
    />
  )
}