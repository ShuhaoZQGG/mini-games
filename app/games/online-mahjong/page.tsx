import type { Metadata } from 'next'
import OnlineMahjong from '@/components/games/multiplayer/OnlineMahjong'

export const metadata: Metadata = {
  title: 'Online Mahjong - Play Free Online | Mini Games',
  description: 'Traditional 4-player tile matching game. Play Online Mahjong free online - no download required!'
}

export default function OnlineMahjongPage() {
  return <OnlineMahjong />
}
