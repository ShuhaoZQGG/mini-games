import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const ChessPuzzles = dynamic(() => import('@/components/games/chess-puzzles'), { ssr: false })

export const metadata: Metadata = {
  title: 'Chess Puzzles | Mini Games Platform',
  description: 'Play Chess Puzzles - Daily tactical challenges with mate-in-X'
}

export default function ChessPuzzlesPage() {
  return <ChessPuzzles />
}