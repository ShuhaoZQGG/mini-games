import type { Metadata } from 'next'
import OnlineCarrom from '@/components/games/multiplayer/OnlineCarrom'

export const metadata: Metadata = {
  title: 'Online Carrom - Play Free Online | Mini Games',
  description: 'Disc flicking board game. Play Online Carrom free online - no download required!'
}

export default function OnlineCarromPage() {
  return <OnlineCarrom />
}
