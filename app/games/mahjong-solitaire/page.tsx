import MahjongSolitaireGame from '@/components/games/mahjong-solitaire/mahjong-solitaire-game'

export const metadata = {
  title: 'Mahjong Solitaire | Mini Games',
  description: 'Play the classic tile-matching game of Mahjong Solitaire',
}

export default function MahjongSolitairePage() {
  return (
    <div className="container-responsive py-8">
      <MahjongSolitaireGame />
    </div>
  )
}