import { Metadata } from 'next'
import OnlineYahtzee from '@/components/games/multiplayer/OnlineYahtzee'

export const metadata: Metadata = {
  title: 'Online Yahtzee - Play Free Dice Game | Mini Games Platform',
  description: 'Play Yahtzee online with friends! Roll dice, make strategic choices, and score big with combinations in this classic multiplayer dice game.',
  keywords: ['online yahtzee', 'dice game', 'multiplayer yahtzee', 'strategy game', 'probability game', 'free yahtzee'],
}

export default function OnlineYahtzeePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineYahtzee />
    </div>
  )
}