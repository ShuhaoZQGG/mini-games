import { Metadata } from 'next'
import AsteroidDodger from '@/components/games/asteroid-dodger'

export const metadata: Metadata = {
  title: 'Asteroid Dodger - Space Obstacle Avoidance | Mini Games',
  description: 'Navigate your spaceship through an asteroid field. Collect power-ups and survive as long as you can!',
  keywords: 'asteroid dodger, space game, obstacle avoidance, survival game, power-ups',
}

export default function AsteroidDodgerPage() {
  return <AsteroidDodger />
}