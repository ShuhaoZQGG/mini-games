import ColorFill from '@/components/games/color-fill'

export const metadata = {
  title: 'Color Fill - Mini Games',
  description: 'Fill the screen color puzzle'
}

export default function ColorFillPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Color Fill</h1>
      <ColorFill />
    </div>
  )
}