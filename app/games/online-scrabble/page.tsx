import { Metadata } from 'next'
import OnlineScrabble from '@/components/games/multiplayer/OnlineScrabble'

export const metadata: Metadata = {
  title: 'Online Scrabble - Play Free Word Game | Mini Games Platform',
  description: 'Play Scrabble online with friends! Create words, earn points with strategic tile placement, and expand your vocabulary in this classic word game.',
  keywords: ['online scrabble', 'word game', 'multiplayer scrabble', 'vocabulary game', 'board game', 'free scrabble'],
}

export default function OnlineScrabblePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineScrabble />
    </div>
  )
}