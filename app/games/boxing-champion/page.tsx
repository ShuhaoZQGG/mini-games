import { Metadata } from 'next'
import BoxingChampion from '@/components/games/action/BoxingChampion'

export const metadata: Metadata = {
  title: 'Boxing Champion - Fighting Game | Mini Games Platform',
  description: 'Step into the ring and become a boxing champion! Master combos, dodge attacks, and knock out opponents in this fighting game.',
  keywords: ['boxing champion', 'fighting game', 'boxing game', 'action game', 'combat game', 'free boxing game'],
}

export default function BoxingChampionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BoxingChampion />
    </div>
  )
}