import { Metadata } from 'next'
import { TypingTestComponent } from '@/components/games/typing-test'

export const metadata: Metadata = {
  title: 'Typing Speed Test - Test Your WPM | Mini Games',
  description: 'Test your typing speed with our free online typing test. Measure your WPM (Words Per Minute) and accuracy!',
  keywords: 'typing test, typing speed test, wpm test, words per minute, typing game',
}

export default function TypingTestPage() {
  return (
    <div className="container-responsive py-8">
      <TypingTestComponent />
    </div>
  )
}