import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const Xiangqi = dynamic(() => import('@/components/games/xiangqi'), { ssr: false })

export const metadata: Metadata = {
  title: 'Xiangqi | Mini Games Platform',
  description: 'Play Xiangqi - Chinese chess with river and palace'
}

export default function XiangqiPage() {
  return <Xiangqi />
}