import type { Metadata } from 'next'
import OnlineLudo from '@/components/games/multiplayer/OnlineLudo'

export const metadata: Metadata = {
  title: 'Online Ludo - Play Free Online | Mini Games',
  description: 'Classic board game with dice. Play Online Ludo free online - no download required!'
}

export default function OnlineLudoPage() {
  return <OnlineLudo />
}
