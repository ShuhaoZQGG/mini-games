import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const SoccerPenalty = dynamic(() => import('@/components/games/soccer-penalty'), { ssr: false })

export const metadata: Metadata = {
  title: 'Soccer Penalty | Mini Games Platform',
  description: 'Play Soccer Penalty - Penalty kick with goalkeeper AI'
}

export default function SoccerPenaltyPage() {
  return <SoccerPenalty />
}