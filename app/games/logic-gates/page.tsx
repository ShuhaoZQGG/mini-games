import type { Metadata } from 'next'
import LogicGates from '@/components/games/brain/LogicGates'

export const metadata: Metadata = {
  title: 'Logic Gates - Play Free Online | Mini Games',
  description: 'Boolean logic puzzles. Play Logic Gates free online - no download required!'
}

export default function LogicGatesPage() {
  return <LogicGates />
}
