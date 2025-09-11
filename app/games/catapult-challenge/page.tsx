import { Metadata } from 'next'
import CatapultChallenge from '@/components/games/catapult-challenge'

export const metadata: Metadata = {
  title: 'Catapult Challenge - Mini Games',
  description: 'Projectile physics with trajectory',
  keywords: ['catapult challenge', 'mini game', 'online game'],
  openGraph: {
    title: 'Catapult Challenge',
    description: 'Projectile physics with trajectory',
    type: 'website',
  },
}

export default function CatapultChallengePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CatapultChallenge />
    </div>
  )
}