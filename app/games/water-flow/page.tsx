import { Metadata } from 'next'
import WaterFlow from '@/components/games/water-flow'

export const metadata: Metadata = {
  title: 'Water Flow - Mini Games',
  description: 'Hydraulic path-finding puzzles',
  keywords: ['water flow', 'mini game', 'online game'],
  openGraph: {
    title: 'Water Flow',
    description: 'Hydraulic path-finding puzzles',
    type: 'website',
  },
}

export default function WaterFlowPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WaterFlow />
    </div>
  )
}