import type { Metadata } from 'next'
import Robotron from '@/components/games/arcade/Robotron'

export const metadata: Metadata = {
  title: 'Robotron - Play Free Online | Mini Games',
  description: 'Twin-stick shooter. Play Robotron free online - no download required!'
}

export default function RobotronPage() {
  return <Robotron />
}
