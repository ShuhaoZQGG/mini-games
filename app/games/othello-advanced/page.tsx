import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const OthelloAdvanced = dynamic(() => import('@/components/games/othello-advanced'), { ssr: false })

export const metadata: Metadata = {
  title: 'Othello Advanced | Mini Games Platform',
  description: 'Play Othello Advanced - Enhanced reversi with AI strategies'
}

export default function OthelloAdvancedPage() {
  return <OthelloAdvanced />
}