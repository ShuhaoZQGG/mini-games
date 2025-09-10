import { Wordle } from '@/components/games/Wordle'

export const metadata = {
  title: 'Wordle - Mini Games',
  description: 'Guess the 5-letter word in 6 tries. A daily word puzzle game.',
}

export default function WordlePage() {
  return <Wordle />
}