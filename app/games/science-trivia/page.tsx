import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const ScienceTrivia = dynamic(() => import('@/components/games/science-trivia'), { ssr: false })

export const metadata: Metadata = {
  title: 'Science Trivia | Mini Games Platform',
  description: 'Play Science Trivia - STEM knowledge quiz with categories'
}

export default function ScienceTriviaPage() {
  return <ScienceTrivia />
}