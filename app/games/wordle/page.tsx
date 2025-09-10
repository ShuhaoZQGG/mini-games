import { Metadata } from 'next'
import { WordleWithLevels } from '@/components/games/Wordle'

export const metadata: Metadata = {
  title: 'Wordle Game with Levels - Word Guessing Puzzle | Mini Games',
  description: 'Play Wordle online for free with multiple difficulty levels. Guess the 5-letter word in 6 attempts with color-coded feedback. Test your vocabulary skills!',
  keywords: 'wordle, word game, word puzzle, guessing game, vocabulary game, daily word, difficulty levels',
}

export default function WordlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WordleWithLevels />
    </div>
  )
}