import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tower Defense Mini - Strategic Defense | Mini Games',
  description: 'Defend your base with strategic tower placement. A tactical game that tests your defensive strategy skills.',
  keywords: 'tower defense, strategy game, defense game, tactical game, tower placement',
}

export default function TowerDefenseMiniPage() {
  return (
    <GamePlaceholder
      title="Tower Defense Mini"
      description="Defend your base with strategic tower placement"
      category="Strategy"
    />
  )
}