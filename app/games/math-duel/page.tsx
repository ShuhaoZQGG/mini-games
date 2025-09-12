import GamePlaceholder from '@/components/games/GamePlaceholder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Math Duel - Quick Math Battles | Mini Games',
  description: 'Compete in quick math battles. Test your mental math skills in competitive speed challenges.',
  keywords: 'math duel, math game, mental math, educational game, competitive math',
}

export default function MathDuelPage() {
  return (
    <GamePlaceholder
      title="Math Duel"
      description="Compete in quick math battles"
      category="Skill"
    />
  )
}