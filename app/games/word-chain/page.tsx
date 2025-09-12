import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Word Chain Game - Transform Words | Mini Games',
  description: 'Create word chains by changing one letter at a time. Test your vocabulary and word transformation skills.',
  keywords: 'word chain, word game, vocabulary, word puzzle, letter change',
}

export default function WordChainPage() {
  return (
    <GamePlaceholder
      title="Word Chain"
      description="Create word chains by changing one letter"
      category="Word"
    />
  )
}