import { Metadata } from 'next'
import MathRace from '@/components/games/math-race'

export const metadata: Metadata = {
  title: 'Math Race - Solve Math Problems Against Time | Mini Games',
  description: 'Race against time solving math problems! Test your mental math skills with addition, subtraction, multiplication and division challenges.',
  keywords: ['math race', 'math game', 'mental math', 'educational game', 'speed math', 'arithmetic game'],
  openGraph: {
    title: 'Math Race - Speed Math Challenge',
    description: 'Race against time solving math problems!',
    type: 'website',
  },
}

export default function MathRacePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MathRace />
    </div>
  )
}