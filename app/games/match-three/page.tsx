import MatchThree from '@/components/games/match-three'

export const metadata = {
  title: 'Match Three - Mini Games',
  description: 'Classic match-3 gameplay with combos'
}

export default function MatchThreePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Match Three</h1>
      <MatchThree />
    </div>
  )
}