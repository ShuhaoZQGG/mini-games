import { Metadata } from 'next'
import FarmManager from '@/components/games/farm-manager'

export const metadata: Metadata = {
  title: 'Farm Manager - Mini Games',
  description: 'Quick agricultural simulation',
  keywords: ['farm manager', 'mini game', 'online game'],
  openGraph: {
    title: 'Farm Manager',
    description: 'Quick agricultural simulation',
    type: 'website',
  },
}

export default function FarmManagerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FarmManager />
    </div>
  )
}