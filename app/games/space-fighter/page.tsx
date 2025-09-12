import { Metadata } from 'next'
import SpaceFighter from '@/components/games/action/SpaceFighter'

export const metadata: Metadata = {
  title: 'Space Fighter - Galactic Combat Game | Mini Games Platform',
  description: 'Pilot your spaceship through enemy waves! Upgrade weapons and shields in this intense space combat action game.',
  keywords: ['space fighter', 'space shooter', 'combat game', 'action game', 'arcade shooter', 'free space game'],
}

export default function SpaceFighterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SpaceFighter />
    </div>
  )
}