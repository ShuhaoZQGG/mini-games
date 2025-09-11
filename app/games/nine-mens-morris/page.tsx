import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const NineMensMorris = dynamic(() => import('@/components/games/nine-mens-morris'), { ssr: false })

export const metadata: Metadata = {
  title: "Nine Men's Morris | Mini Games Platform",
  description: "Play Nine Men's Morris - Mill formation strategy game"
}

export default function NineMensMorrisPage() {
  return <NineMensMorris />
}