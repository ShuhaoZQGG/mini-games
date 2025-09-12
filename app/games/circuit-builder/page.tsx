import { Metadata } from 'next'
import CircuitBuilder from '@/components/games/circuit-builder'

export const metadata: Metadata = {
  title: 'Circuit Builder - Mini Games',
  description: 'Logic gate and electrical puzzles',
  keywords: ['circuit builder', 'mini game', 'online game'],
  openGraph: {
    title: 'Circuit Builder',
    description: 'Logic gate and electrical puzzles',
    type: 'website',
  },
}

export default function CircuitBuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CircuitBuilder />
    </div>
  )
}