import type { Metadata } from 'next'
import GalagaRedux from '@/components/games/arcade/GalagaRedux'

export const metadata: Metadata = {
  title: 'Galaga Redux - Play Free Online | Mini Games',
  description: 'Enhanced space shooter. Play Galaga Redux free online - no download required!'
}

export default function GalagaReduxPage() {
  return <GalagaRedux />
}
