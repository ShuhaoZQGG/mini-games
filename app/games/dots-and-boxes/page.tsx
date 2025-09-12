import DotsAndBoxesGame from '@/components/games/dots-and-boxes/dots-and-boxes-game'

export const metadata = {
  title: 'Dots and Boxes | Mini Games',
  description: 'Play the classic pencil and paper game of Dots and Boxes online',
}

export default function DotsAndBoxesPage() {
  return (
    <div className="container-responsive py-8">
      <DotsAndBoxesGame />
    </div>
  )
}