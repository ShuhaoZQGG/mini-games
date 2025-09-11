import type { Metadata } from 'next'
import PatternMatrix from '@/components/games/brain/PatternMatrix'

export const metadata: Metadata = {
  title: 'Pattern Matrix - Play Free Online | Mini Games',
  description: 'Visual pattern completion. Play Pattern Matrix free online - no download required!'
}

export default function PatternMatrixPage() {
  return <PatternMatrix />
}
