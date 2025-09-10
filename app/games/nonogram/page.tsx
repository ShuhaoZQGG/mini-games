import Nonogram from '@/components/games/Nonogram'

export const metadata = {
  title: 'Nonogram - Mini Games',
  description: 'Solve picture logic puzzles by filling cells according to number clues',
}

export default function NonogramPage() {
  return (
    <div className="container-responsive py-8">
      <Nonogram />
    </div>
  )
}