import { Metadata } from 'next'
import LaserQuest from '@/components/games/action/LaserQuest'

export const metadata: Metadata = {
  title: 'Laser Quest - Precision Shooting Game | Mini Games Platform',
  description: 'Navigate laser mazes and hit targets with precision! Use mirrors and timing in this strategic action puzzle game.',
  keywords: ['laser quest', 'shooting game', 'puzzle action', 'laser game', 'precision game', 'free laser game'],
}

export default function LaserQuestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LaserQuest />
    </div>
  )
}