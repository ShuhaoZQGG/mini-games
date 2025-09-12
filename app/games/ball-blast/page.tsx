import { Metadata } from 'next'
import BallBlast from '@/components/games/ball-blast'

export const metadata: Metadata = {
  title: 'Ball Blast - Shoot Balls to Break Blocks | Mini Games',
  description: 'Shoot balls to break numbered blocks! An action-packed arcade game where you need to destroy blocks before they reach the bottom.',
  keywords: ['ball blast', 'shooting game', 'arcade game', 'action game', 'block breaker', 'ball shooter'],
  openGraph: {
    title: 'Ball Blast - Block Breaking Action',
    description: 'Shoot balls to break numbered blocks in this exciting arcade game!',
    type: 'website',
  },
}

export default function BallBlastPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BallBlast />
    </div>
  )
}