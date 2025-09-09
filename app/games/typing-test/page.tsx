import { Metadata } from 'next'
import { TypingTestWithLevels } from '@/components/games/typing-test-with-levels'

export const metadata: Metadata = {
  title: 'Typing Speed Test - Test Your WPM | Mini Games',
  description: 'Test your typing speed with our free online typing test. Measure your WPM (Words Per Minute) and accuracy across multiple difficulty levels!',
  keywords: 'typing test, typing speed test, wpm test, words per minute, typing game, typing levels',
}

export default function TypingTestPage() {
  return (
    <div className="container-responsive py-8">
      <TypingTestWithLevels />
    </div>
  )
}