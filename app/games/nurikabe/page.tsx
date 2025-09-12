import { Metadata } from 'next'
import Nurikabe from '@/components/games/puzzle/Nurikabe'

export const metadata: Metadata = {
  title: 'Nurikabe - Island Logic Puzzle | Mini Games Platform',
  description: 'Create islands and walls following number clues. A complex Japanese logic puzzle that tests your deductive reasoning.',
  keywords: ['nurikabe', 'island puzzle', 'logic game', 'japanese puzzle', 'deduction game', 'free nurikabe'],
}

export default function NurikabePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Nurikabe />
    </div>
  )
}