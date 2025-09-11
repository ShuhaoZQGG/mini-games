import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const GeographyQuiz = dynamic(() => import('@/components/games/geography-quiz'), { ssr: false })

export const metadata: Metadata = {
  title: 'Geography Quiz | Mini Games Platform',
  description: 'Play Geography Quiz - Test your knowledge of world capitals, flags, and famous landmarks! Progress through levels with increasing difficulty.'
}

export default function GeographyQuizPage() {
  return <GeographyQuiz />
}