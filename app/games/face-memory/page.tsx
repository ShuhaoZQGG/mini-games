import { Metadata } from 'next'
import FaceMemory from '@/components/games/face-memory'

export const metadata: Metadata = {
  title: 'Face Memory - Mini Games',
  description: 'Facial recognition and recall',
  keywords: ['face memory', 'mini game', 'online game'],
  openGraph: {
    title: 'Face Memory',
    description: 'Facial recognition and recall',
    type: 'website',
  },
}

export default function FaceMemoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FaceMemory />
    </div>
  )
}