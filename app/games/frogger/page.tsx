import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const Frogger = dynamic(() => import('@/components/games/frogger'), { ssr: false })

export const metadata: Metadata = {
  title: 'Frogger | Mini Games Platform',
  description: 'Play Frogger - Traffic crossing with multiple lanes'
}

export default function FroggerPage() {
  return <Frogger />
}