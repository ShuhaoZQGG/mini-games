import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const MathBlaster = dynamic(() => import('@/components/games/math-blaster'), { ssr: false })

export const metadata: Metadata = {
  title: 'Math Blaster | Mini Games Platform',
  description: 'Play Math Blaster - Speed arithmetic challenge with addition, subtraction, multiplication, and division! Race against time and build your streak.'
}

export default function MathBlasterPage() {
  return <MathBlaster />
}