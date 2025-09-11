import type { Metadata } from 'next'
import WordAssociation from '@/components/games/brain/WordAssociation'

export const metadata: Metadata = {
  title: 'Word Association - Play Free Online | Mini Games',
  description: 'Language connection game. Play Word Association free online - no download required!'
}

export default function WordAssociationPage() {
  return <WordAssociation />
}
