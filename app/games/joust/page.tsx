import type { Metadata } from 'next'
import Joust from '@/components/games/arcade/Joust'

export const metadata: Metadata = {
  title: 'Joust - Play Free Online | Mini Games',
  description: 'Flying knight combat. Play Joust free online - no download required!'
}

export default function JoustPage() {
  return <Joust />
}
