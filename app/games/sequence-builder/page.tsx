import { Metadata } from 'next'
import SequenceBuilder from '@/components/games/sequence-builder'

export const metadata: Metadata = {
  title: 'Sequence Builder - Mini Games',
  description: 'Complex pattern memorization',
  keywords: ['sequence builder', 'mini game', 'online game'],
  openGraph: {
    title: 'Sequence Builder',
    description: 'Complex pattern memorization',
    type: 'website',
  },
}

export default function SequenceBuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SequenceBuilder />
    </div>
  )
}