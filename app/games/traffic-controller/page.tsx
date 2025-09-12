import { Metadata } from 'next'
import TrafficController from '@/components/games/traffic-controller'

export const metadata: Metadata = {
  title: 'Traffic Controller - Mini Games',
  description: 'Intersection traffic management',
  keywords: ['traffic controller', 'mini game', 'online game'],
  openGraph: {
    title: 'Traffic Controller',
    description: 'Intersection traffic management',
    type: 'website',
  },
}

export default function TrafficControllerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TrafficController />
    </div>
  )
}