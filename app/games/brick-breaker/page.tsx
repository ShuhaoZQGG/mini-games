import { Metadata } from 'next'
import GamePlaceholder from '@/components/games/GamePlaceholder'

export const metadata: Metadata = {
  title: 'Brick Breaker - Classic Arcade Game | Mini Games',
  description: 'Play the classic brick breaking arcade game! Use your paddle to bounce the ball and destroy all bricks.',
  keywords: ['brick breaker', 'arcade game', 'breakout game', 'paddle game', 'classic game', 'brick game'],
  openGraph: {
    title: 'Brick Breaker - Classic Arcade',
    description: 'Break all the bricks with your paddle and ball!',
    type: 'website',
  },
}

export default function BrickBreakerPage() {
  return (
    <GamePlaceholder
      title="Brick Breaker"
      description="Classic brick breaking game"
      category="Arcade"
    />
  )
}