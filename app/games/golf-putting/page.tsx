import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const GolfPutting = dynamic(() => import('@/components/games/golf-putting'), { ssr: false })

export const metadata: Metadata = {
  title: 'Golf Putting | Mini Games Platform',
  description: 'Play Golf Putting - Mini putting with wind and slope physics'
}

export default function GolfPuttingPage() {
  return <GolfPutting />
}