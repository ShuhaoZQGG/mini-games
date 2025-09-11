import BubblePop from '@/components/games/bubble-pop'

export const metadata = {
  title: 'Bubble Pop - Mini Games',
  description: 'Simple bubble popping game with chain reactions'
}

export default function BubblePopPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Bubble Pop</h1>
      <BubblePop />
    </div>
  )
}