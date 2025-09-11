import type { Metadata } from 'next'
import OnlineRummy500 from '@/components/games/multiplayer/OnlineRummy500'

export const metadata: Metadata = {
  title: 'Online Rummy 500 - Play Free Online | Mini Games',
  description: 'Point-based card game. Play Online Rummy 500 free online - no download required!'
}

export default function OnlineRummy500Page() {
  return <OnlineRummy500 />
}
