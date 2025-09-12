import type { Metadata } from 'next'
import BurgerTime from '@/components/games/arcade/BurgerTime'

export const metadata: Metadata = {
  title: 'Burger Time - Play Free Online | Mini Games',
  description: 'Food assembly arcade. Play Burger Time free online - no download required!'
}

export default function BurgerTimePage() {
  return <BurgerTime />
}
