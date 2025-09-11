import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const Centipede = dynamic(() => import('@/components/games/centipede'), { ssr: false })

export const metadata: Metadata = {
  title: 'Centipede | Mini Games Platform',
  description: 'Play Centipede - Mushroom field shooter with segments'
}

export default function CentipedePage() {
  return <Centipede />
}