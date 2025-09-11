import { Metadata } from 'next'
import DrumMachine from '@/components/games/drum-machine'

export const metadata: Metadata = {
  title: 'Drum Machine - Mini Games',
  description: 'Create beats with virtual drums',
  keywords: ['drum machine', 'mini game', 'online game'],
  openGraph: {
    title: 'Drum Machine',
    description: 'Create beats with virtual drums',
    type: 'website',
  },
}

export default function DrumMachinePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DrumMachine />
    </div>
  )
}