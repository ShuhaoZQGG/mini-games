import { Metadata } from 'next'
import Slitherlink from '@/components/games/puzzle/Slitherlink'

export const metadata: Metadata = {
  title: 'Slitherlink - Loop Logic Puzzle | Mini Games Platform',
  description: 'Create a single continuous loop by connecting dots based on number clues. A challenging Japanese logic puzzle.',
  keywords: ['slitherlink', 'loop puzzle', 'logic game', 'japanese puzzle', 'brain teaser', 'free slitherlink'],
}

export default function SlitherlinkPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Slitherlink />
    </div>
  )
}