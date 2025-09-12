import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const Defender = dynamic(() => import('@/components/games/defender'), { ssr: false })

export const metadata: Metadata = {
  title: 'Defender | Mini Games Platform',
  description: 'Play Defender - Horizontal space defender with rescue missions'
}

export default function DefenderPage() {
  return <Defender />
}