import { Metadata } from 'next'
import FlowConnect from '@/components/games/puzzle/FlowConnect'

export const metadata: Metadata = {
  title: 'Flow Connect - Color Path Puzzle | Mini Games Platform',
  description: 'Connect matching colors with pipes, filling the entire board without crossing paths. A relaxing yet challenging puzzle game.',
  keywords: ['flow connect', 'pipe puzzle', 'color matching', 'path puzzle', 'logic game', 'free flow game'],
}

export default function FlowConnectPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FlowConnect />
    </div>
  )
}