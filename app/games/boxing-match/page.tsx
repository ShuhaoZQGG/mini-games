import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const BoxingMatch = dynamic(() => import('@/components/games/boxing-match'), { ssr: false })

export const metadata: Metadata = {
  title: 'Boxing Match | Mini Games Platform',
  description: 'Play Boxing Match - Timing-based combat with combos'
}

export default function BoxingMatchPage() {
  return <BoxingMatch />
}