import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const Mancala = dynamic(() => import('@/components/games/mancala'), { ssr: false })

export const metadata: Metadata = {
  title: 'Mancala | Mini Games Platform',
  description: 'Play Mancala - Ancient counting game with capture rules'
}

export default function MancalaPage() {
  return <Mancala />
}