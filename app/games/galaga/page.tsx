import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const Galaga = dynamic(() => import('@/components/games/galaga'), { ssr: false })

export const metadata: Metadata = {
  title: 'Galaga | Mini Games Platform',
  description: 'Play Galaga - Formation space shooter with patterns'
}

export default function GalagaPage() {
  return <Galaga />
}