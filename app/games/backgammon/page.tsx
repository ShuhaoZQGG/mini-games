import BackgammonGame from '@/components/games/backgammon/backgammon-game'

export const metadata = {
  title: 'Backgammon | Mini Games',
  description: 'Play the classic board game of Backgammon online with friends or against AI',
}

export default function BackgammonPage() {
  return (
    <div className="container-responsive py-8">
      <BackgammonGame />
    </div>
  )
}