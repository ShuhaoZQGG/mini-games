import { Metadata } from 'next'
import Breakout from '@/components/games/breakout'

export const metadata: Metadata = {
  title: 'Breakout - Classic Brick Breaking Game | Mini Games',
  description: 'Play the classic Breakout arcade game! Break all the bricks with your ball and paddle. Multiple levels and challenging gameplay.',
  keywords: 'breakout, brick breaker, arcade game, paddle game, classic game',
}

export default function BreakoutPage() {
  return <Breakout />
}