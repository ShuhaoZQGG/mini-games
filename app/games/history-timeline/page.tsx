import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const HistoryTimeline = dynamic(() => import('@/components/games/history-timeline'), { ssr: false })

export const metadata: Metadata = {
  title: 'History Timeline | Mini Games Platform',
  description: 'Play History Timeline - Order historical events chronologically! Test your knowledge of world history across different eras.'
}

export default function HistoryTimelinePage() {
  return <HistoryTimeline />
}