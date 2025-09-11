import { Metadata } from 'next'
import DominoChain from '@/components/games/domino-chain'

export const metadata: Metadata = {
  title: 'Domino Chain - Mini Games',
  description: 'Create chain reactions with physics',
  keywords: ['domino chain', 'mini game', 'online game'],
  openGraph: {
    title: 'Domino Chain',
    description: 'Create chain reactions with physics',
    type: 'website',
  },
}

export default function DominoChainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DominoChain />
    </div>
  )
}