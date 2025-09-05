import { Metadata } from 'next';
import { WordSearch } from '@/components/games/word-search';

export const metadata: Metadata = {
  title: 'Word Search - Mini Games',
  description: 'Play Word Search online! Find hidden words in the letter grid. Test your observation skills with this classic puzzle game.',
  keywords: 'word search, word puzzle, puzzle game, word game, find words, online game',
};

export default function WordSearchPage() {
  return <WordSearch />;
}