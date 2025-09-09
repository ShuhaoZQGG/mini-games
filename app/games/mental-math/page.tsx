import { Metadata } from 'next'
import MentalMathWithLevels from '@/components/games/mental-math-with-levels'

export const metadata: Metadata = {
  title: 'Mental Math - Quick Calculation Game | Mini Games',
  description: 'Test your mental math skills! Solve addition, subtraction, multiplication and division problems as fast as you can.',
  keywords: 'mental math, math game, calculation game, arithmetic game, brain training',
}

export default function MentalMathPage() {
  return <MentalMathWithLevels />
}