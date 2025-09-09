import { Metadata } from 'next'
import { WordleGame } from '@/components/games/wordle'

export const metadata: Metadata = {
  title: 'Wordle - Daily Word Puzzle Game | Mini Games',
  description: 'Play Wordle online for free! Guess the 5-letter word in 6 tries. New puzzles every game. Test your vocabulary and deduction skills!',
  keywords: 'wordle, word game, word puzzle, vocabulary game, guessing game, daily puzzle',
}

export default function WordlePage() {
  return (
    <div className="container-responsive py-8">
      <WordleGame />
    </div>
  )
}