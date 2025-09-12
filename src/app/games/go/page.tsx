import { Metadata } from 'next'
import { GoGame } from '@/components/games/go/go-game'

export const metadata: Metadata = {
  title: 'Go | Mini Games',
  description: 'Play Go online - Ancient strategic board game with territory control'
}

export default function GoPage() {
  return (
    <div className="container mx-auto py-8">
      <GoGame boardSize={9} />
    </div>
  )
}