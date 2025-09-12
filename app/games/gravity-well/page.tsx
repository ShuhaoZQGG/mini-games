import { Metadata } from 'next'
import GravityWell from '@/components/games/gravity-well'

export const metadata: Metadata = {
  title: 'Gravity Well - Mini Games',
  description: 'Manipulate gravity to guide objects',
  keywords: ['gravity well', 'mini game', 'online game'],
  openGraph: {
    title: 'Gravity Well',
    description: 'Manipulate gravity to guide objects',
    type: 'website',
  },
}

export default function GravityWellPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <GravityWell />
    </div>
  )
}