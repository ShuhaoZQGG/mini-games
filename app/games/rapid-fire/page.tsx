import { Metadata } from 'next'
import RapidFire from '@/components/games/rapid-fire'

export const metadata: Metadata = {
  title: 'Rapid Fire - Quick Shooting Gallery | Mini Games',
  description: 'Test your accuracy and speed in this fast-paced shooting gallery game. Build combos for high scores!',
  keywords: 'rapid fire, shooting game, accuracy game, target practice, combo game',
}

export default function RapidFirePage() {
  return <RapidFire />
}