import { Metadata } from 'next'
import CityBuilderMini from '@/components/games/city-builder-mini'

export const metadata: Metadata = {
  title: 'City Builder Mini - Mini Games',
  description: 'Simplified urban planning',
  keywords: ['city builder mini', 'mini game', 'online game'],
  openGraph: {
    title: 'City Builder Mini',
    description: 'Simplified urban planning',
    type: 'website',
  },
}

export default function CityBuilderMiniPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CityBuilderMini />
    </div>
  )
}