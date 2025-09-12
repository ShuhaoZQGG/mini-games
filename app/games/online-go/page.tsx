import type { Metadata } from 'next'
import OnlineGo from '@/components/games/multiplayer/OnlineGo'

export const metadata: Metadata = {
  title: 'Online Go - Play Free Online | Mini Games',
  description: 'Ancient strategy board game. Play Online Go free online - no download required!'
}

export default function OnlineGoPage() {
  return <OnlineGo />
}
