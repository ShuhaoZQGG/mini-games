import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const Qbert = dynamic(() => import('@/components/games/qbert'), { ssr: false })

export const metadata: Metadata = {
  title: 'Q*bert | Mini Games Platform',
  description: 'Play Q*bert - Isometric pyramid hopper with color changes'
}

export default function QbertPage() {
  return <Qbert />
}