import { Metadata } from 'next'
import EcosystemBalance from '@/components/games/ecosystem-balance'

export const metadata: Metadata = {
  title: 'Ecosystem Balance - Mini Games',
  description: 'Simple predator-prey dynamics',
  keywords: ['ecosystem balance', 'mini game', 'online game'],
  openGraph: {
    title: 'Ecosystem Balance',
    description: 'Simple predator-prey dynamics',
    type: 'website',
  },
}

export default function EcosystemBalancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EcosystemBalance />
    </div>
  )
}