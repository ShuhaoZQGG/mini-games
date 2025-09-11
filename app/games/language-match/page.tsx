import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const LanguageMatch = dynamic(() => import('@/components/games/language-match'), { ssr: false })

export const metadata: Metadata = {
  title: 'Language Match | Mini Games Platform',
  description: 'Play Language Match - Learn vocabulary by matching words with their translations in multiple languages!'
}

export default function LanguageMatchPage() {
  return <LanguageMatch />
}