import { Metadata } from 'next'
import Wordle from '@/components/games/Wordle'

export const metadata: Metadata = {
  title: 'Wordle | Mini Games Platform',
  description: 'Play Wordle - Guess the 5-letter word in 6 attempts. Test your vocabulary and deduction skills!',
  keywords: 'wordle, word game, puzzle, vocabulary, guessing game',
}

export default function WordlePage() {
  return (
    <div className="container-responsive py-8">
      <Wordle />
    </div>
  )
}