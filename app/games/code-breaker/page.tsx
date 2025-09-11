import { Metadata } from 'next';
import CodeBreaker from '@/components/games/code-breaker';

export const metadata: Metadata = {
  title: 'Code Breaker - Mini Games',
  description: 'Play Code Breaker online! Solve programming logic puzzles and learn coding concepts. Test your problem-solving skills!',
  keywords: 'code breaker, programming, logic puzzles, coding game, algorithms, problem solving, educational',
};

export default function CodeBreakerPage() {
  return <CodeBreaker />;
}