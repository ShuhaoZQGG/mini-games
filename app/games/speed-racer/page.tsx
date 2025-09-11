import { Metadata } from 'next'
import SpeedRacer from '@/components/games/speed-racer'

export const metadata: Metadata = {
  title: 'Speed Racer - Quick Reaction Racing | Mini Games',
  description: 'Test your reflexes in this fast-paced racing game. Dodge obstacles and collect power-ups!',
  keywords: 'speed racer, racing game, reaction game, dodge game, power-ups',
}

export default function SpeedRacerPage() {
  return <SpeedRacer />
}