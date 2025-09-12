import type { Metadata } from 'next'
import SpeedMath from '@/components/games/brain/SpeedMath'

export const metadata: Metadata = {
  title: 'Speed Math - Play Free Online | Mini Games',
  description: 'Mental calculation challenges. Play Speed Math free online - no download required!'
}

export default function SpeedMathPage() {
  return <SpeedMath />
}
