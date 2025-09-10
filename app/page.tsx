import Link from 'next/link'

export default function HomePage() {
  const singlePlayerGames = [
    { id: 'cps-test', name: 'CPS Test', description: 'Test your clicking speed', path: '/games/cps-test' },
    { id: 'reaction-time', name: 'Reaction Time', description: 'Test your reflexes', path: '/games/reaction-time' },
    { id: 'aim-trainer', name: 'Aim Trainer', description: 'Test your accuracy', path: '/games/aim-trainer' },
    { id: 'memory-match', name: 'Memory Match', description: 'Match the cards', path: '/games/memory-match' },
    { id: 'typing-test', name: 'Typing Test', description: 'Test your typing speed', path: '/games/typing-test' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Classic X and O game', path: '/games/tic-tac-toe' },
    { id: 'minesweeper', name: 'Minesweeper', description: 'Find all the mines', path: '/games/minesweeper' },
    { id: 'snake', name: 'Snake', description: 'Classic snake game', path: '/games/snake' },
    { id: '2048', name: '2048', description: 'Slide tiles to reach 2048', path: '/games/2048' },
    { id: 'sudoku', name: 'Sudoku', description: 'Number puzzle game', path: '/games/sudoku' },
    { id: 'connect-four', name: 'Connect Four', description: 'Get four in a row', path: '/games/connect-four' },
    { id: 'word-search', name: 'Word Search', description: 'Find hidden words', path: '/games/word-search' },
    { id: 'tetris', name: 'Tetris', description: 'Stack falling blocks', path: '/games/tetris' },
    { id: 'breakout', name: 'Breakout', description: 'Break all the bricks', path: '/games/breakout' },
    { id: 'mental-math', name: 'Mental Math', description: 'Solve math problems', path: '/games/mental-math' },
    { id: 'pacman', name: 'Pac-Man', description: 'Classic arcade maze game', path: '/games/pacman' },
    { id: 'space-invaders', name: 'Space Invaders', description: 'Defend Earth from aliens', path: '/games/space-invaders' },
    { id: 'pattern-memory', name: 'Pattern Memory', description: 'Test your memory skills', path: '/games/pattern-memory' },
    { id: 'color-switch', name: 'Color Switch', description: 'Match colors to survive', path: '/games/color-switch' },
    { id: 'sliding-puzzle', name: 'Sliding Puzzle', description: 'Classic 15-puzzle game', path: '/games/sliding-puzzle' },
    { id: 'crossword', name: 'Crossword', description: 'Word puzzle challenges', path: '/games/crossword' },
    { id: 'solitaire', name: 'Solitaire', description: 'Classic card game', path: '/games/solitaire' },
    { id: 'simon-says', name: 'Simon Says', description: 'Memory pattern game', path: '/games/simon-says' },
    { id: 'whack-a-mole', name: 'Whack-a-Mole', description: 'Test your reflexes', path: '/games/whack-a-mole' },
    { id: 'blackjack', name: 'Blackjack', description: 'Casino card game', path: '/games/blackjack' },
    { id: 'video-poker', name: 'Video Poker', description: 'Jacks or Better poker', path: '/games/video-poker' },
    { id: 'flappy-bird', name: 'Flappy Bird', description: 'Navigate through pipes', path: '/games/flappy-bird' },
    { id: 'stack-tower', name: 'Stack Tower', description: 'Build the tallest tower', path: '/games/stack-tower' },
    { id: 'doodle-jump', name: 'Doodle Jump', description: 'Jump to new heights', path: '/games/doodle-jump' },
    { id: 'jigsaw', name: 'Jigsaw Puzzle', description: 'Piece together puzzles', path: '/games/jigsaw' },
    { id: 'pinball', name: 'Pinball', description: 'Classic arcade pinball', path: '/games/pinball' },
    { id: 'nonogram', name: 'Nonogram', description: 'Picture logic puzzles', path: '/games/nonogram' },
  ]
  
  const multiplayerGames = [
    { id: 'chess', name: 'Chess', description: 'Strategic board game', path: '/games/chess' },
    { id: 'pool', name: '8-Ball Pool', description: 'Classic billiards game', path: '/games/pool' },
    { id: 'checkers', name: 'Checkers', description: 'Classic strategy game', path: '/games/checkers' },
    { id: 'battleship', name: 'Battleship', description: 'Naval strategy game', path: '/games/battleship' },
    { id: 'air-hockey', name: 'Air Hockey', description: 'Fast-paced table game', path: '/games/air-hockey' },
    { id: 'go', name: 'Go', description: 'Ancient strategy game', path: '/games/go' },
    { id: 'reversi', name: 'Reversi/Othello', description: 'Disc-flipping strategy', path: '/games/reversi' },
    { id: 'backgammon', name: 'Backgammon', description: 'Classic board game', path: '/games/backgammon' },
    { id: 'dots-and-boxes', name: 'Dots and Boxes', description: 'Connect dots to win', path: '/games/dots-and-boxes' },
    { id: 'mahjong-solitaire', name: 'Mahjong Solitaire', description: 'Tile matching puzzle', path: '/games/mahjong-solitaire' },
  ]

  return (
    <div>
      <section className="bg-gradient-to-b from-primary to-indigo-700 text-white py-16">
        <div className="container-responsive text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Play Free Mini Games</h1>
          <p className="text-xl">No registration required. Start playing instantly!</p>
        </div>
      </section>

      <div className="container-responsive py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Single Player Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {singlePlayerGames.map((game) => (
              <Link key={game.id} href={game.path}>
                <div className="game-card cursor-pointer hover:scale-105 transition-transform">
                  <h4 className="text-xl font-semibold mb-2">{game.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{game.description}</p>
                  <button className="mt-4 btn-primary">Play Now</button>
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-6">Multiplayer Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {multiplayerGames.map((game) => (
              <Link key={game.id} href={game.path}>
                <div className="game-card cursor-pointer hover:scale-105 transition-transform border-2 border-blue-500">
                  <h4 className="text-xl font-semibold mb-2">{game.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{game.description}</p>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-500 text-white rounded mb-2">Multiplayer</span>
                  <button className="mt-4 btn-primary">Play Now</button>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}