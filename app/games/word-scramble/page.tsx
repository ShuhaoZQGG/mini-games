import { Metadata } from 'next'
import WordScramble from '@/components/games/word-scramble'

export const metadata: Metadata = {
  title: 'Word Scramble - Unscramble Letters to Form Words | Mini Games',
  description: 'Challenge your vocabulary skills! Unscramble letters to form words in this fun and educational word puzzle game.',
  keywords: ['word scramble', 'word game', 'vocabulary game', 'puzzle game', 'letter game', 'unscramble'],
  openGraph: {
    title: 'Word Scramble - Vocabulary Challenge',
    description: 'Unscramble letters to form words!',
    type: 'website',
  },
}

export default function WordScramblePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WordScramble />
    </div>
  )
}