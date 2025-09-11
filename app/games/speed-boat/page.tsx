import { Metadata } from 'next'
import SpeedBoat from '@/components/games/action/SpeedBoat'

export const metadata: Metadata = {
  title: 'Speed Boat - Water Racing Game | Mini Games Platform',
  description: 'Race your speedboat through challenging water courses! Dodge obstacles and compete for the best time in this thrilling racing game.',
  keywords: ['speed boat', 'racing game', 'water racing', 'action game', 'boat game', 'free racing game'],
}

export default function SpeedBoatPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SpeedBoat />
    </div>
  )
}