import { Metadata } from 'next'
import OnlineRisk from '@/components/games/multiplayer/OnlineRisk'

export const metadata: Metadata = {
  title: 'Online Risk - World Domination Strategy | Mini Games Platform',
  description: 'Play Risk online! Conquer territories, build armies, and dominate the world map in this epic multiplayer strategy game.',
  keywords: ['online risk', 'strategy game', 'world domination', 'multiplayer risk', 'conquest game', 'free risk'],
}

export default function OnlineRiskPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineRisk />
    </div>
  )
}