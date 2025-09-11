import { Metadata } from 'next'
import LaserTag from '@/components/games/laser-tag'

export const metadata: Metadata = {
  title: 'Laser Tag - Mini Games',
  description: 'Strategic laser-based combat',
  keywords: ['laser tag', 'mini game', 'online game'],
  openGraph: {
    title: 'Laser Tag',
    description: 'Strategic laser-based combat',
    type: 'website',
  },
}

export default function LaserTagPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LaserTag />
    </div>
  )
}