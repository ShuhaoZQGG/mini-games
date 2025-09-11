import { Metadata } from 'next'
import ParkourRunner from '@/components/games/parkour-runner'

export const metadata: Metadata = {
  title: 'Parkour Runner - Mini Games',
  description: 'Advanced obstacle course navigation',
  keywords: ['parkour runner', 'mini game', 'online game'],
  openGraph: {
    title: 'Parkour Runner',
    description: 'Advanced obstacle course navigation',
    type: 'website',
  },
}

export default function ParkourRunnerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ParkourRunner />
    </div>
  )
}