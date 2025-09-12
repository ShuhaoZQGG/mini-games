import type { Metadata } from 'next'
import DigDugRedux from '@/components/games/arcade/DigDugRedux'

export const metadata: Metadata = {
  title: 'Dig Dug Redux - Play Free Online | Mini Games',
  description: 'Underground adventure. Play Dig Dug Redux free online - no download required!'
}

export default function DigDugReduxPage() {
  return <DigDugRedux />
}
