import { Metadata } from 'next'
import LocationMemory from '@/components/games/location-memory'

export const metadata: Metadata = {
  title: 'Location Memory - Mini Games',
  description: 'Spatial memory challenges',
  keywords: ['location memory', 'mini game', 'online game'],
  openGraph: {
    title: 'Location Memory',
    description: 'Spatial memory challenges',
    type: 'website',
  },
}

export default function LocationMemoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LocationMemory />
    </div>
  )
}