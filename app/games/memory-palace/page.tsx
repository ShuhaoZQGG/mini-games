import type { Metadata } from 'next'
import MemoryPalace from '@/components/games/brain/MemoryPalace'

export const metadata: Metadata = {
  title: 'Memory Palace - Play Free Online | Mini Games',
  description: 'Spatial memory training. Play Memory Palace free online - no download required!'
}

export default function MemoryPalacePage() {
  return <MemoryPalace />
}
