import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const Shogi = dynamic(() => import('@/components/games/shogi'), { ssr: false })

export const metadata: Metadata = {
  title: 'Shogi | Mini Games Platform',
  description: 'Play Shogi - Japanese chess variant with drops'
}

export default function ShogiPage() {
  return <Shogi />
}