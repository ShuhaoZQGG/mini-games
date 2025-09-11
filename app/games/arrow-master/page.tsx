import { Metadata } from 'next'
import ArrowMaster from '@/components/games/action/ArrowMaster'

export const metadata: Metadata = {
  title: 'Arrow Master - Archery Precision Game | Mini Games Platform',
  description: 'Master the bow and arrow! Hit moving targets and bullseyes in this skill-based archery action game.',
  keywords: ['arrow master', 'archery game', 'shooting game', 'action game', 'precision game', 'free archery game'],
}

export default function ArrowMasterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ArrowMaster />
    </div>
  )
}