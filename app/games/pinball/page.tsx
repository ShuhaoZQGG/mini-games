import Pinball from '@/components/games/Pinball'

export const metadata = {
  title: 'Pinball - Mini Games',
  description: 'Play classic pinball with flippers, bumpers, and high scores',
}

export default function PinballPage() {
  return (
    <div className="container-responsive py-8">
      <Pinball />
    </div>
  )
}