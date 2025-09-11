import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const ChemistryLab = dynamic(() => import('@/components/games/chemistry-lab'), { ssr: false })

export const metadata: Metadata = {
  title: 'Chemistry Lab | Mini Games Platform',
  description: 'Play Chemistry Lab - Match elements and build compounds in this educational chemistry puzzle game! Learn the periodic table while having fun.'
}

export default function ChemistryLabPage() {
  return <ChemistryLab />
}