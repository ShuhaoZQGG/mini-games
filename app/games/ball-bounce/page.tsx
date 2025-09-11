import BallBounce from '@/components/games/ball-bounce'

export const metadata = {
  title: 'Ball Bounce - Mini Games',
  description: 'Physics-based bouncing ball game'
}

export default function BallBouncePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Ball Bounce</h1>
      <BallBounce />
    </div>
  )
}