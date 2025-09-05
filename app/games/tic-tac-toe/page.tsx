import { Metadata } from 'next';
import TicTacToeGame from '@/components/games/tic-tac-toe';

export const metadata: Metadata = {
  title: 'Tic-Tac-Toe - Play Online Against AI or Friend | Mini Games',
  description: 'Play Tic-Tac-Toe online! Challenge the AI with multiple difficulty levels or play against a friend. Classic X and O strategy game.',
  keywords: 'tic tac toe, noughts and crosses, x and o game, strategy game, ai game, multiplayer game',
};

export default function TicTacToePage() {
  return <TicTacToeGame />;
}