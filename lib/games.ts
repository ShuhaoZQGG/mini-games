export interface Game {
  id: string
  name: string
  description: string
  emoji: string
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  minPlayers?: number
  maxPlayers?: number
}

export const games: Game[] = [
  // Quick Games
  { id: 'cps-test', name: 'CPS Test', description: 'Test your clicking speed', emoji: '🖱️', category: 'quick' },
  { id: 'reaction-time', name: 'Reaction Time', description: 'Measure your reflexes', emoji: '⚡', category: 'quick' },
  { id: 'coin-flip', name: 'Coin Flip', description: 'Heads or tails betting game', emoji: '🪙', category: 'quick' },
  { id: 'dice-roll', name: 'Dice Roll', description: 'Target-based dice rolling game', emoji: '🎲', category: 'quick' },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', description: 'Classic hand game against AI', emoji: '✂️', category: 'quick' },
  { id: 'number-guessing', name: 'Number Guessing', description: 'Guess the secret number with hints', emoji: '🔢', category: 'quick' },
  
  // Puzzle Games
  { id: '2048', name: '2048', description: 'Slide tiles to reach 2048', emoji: '🔢', category: 'puzzle' },
  { id: 'sudoku', name: 'Sudoku', description: 'Number puzzle game', emoji: '🔤', category: 'puzzle' },
  { id: 'word-search', name: 'Word Search', description: 'Find hidden words', emoji: '🔍', category: 'puzzle' },
  { id: 'crossword-puzzle', name: 'Crossword', description: 'Word puzzle challenges', emoji: '✏️', category: 'puzzle' },
  { id: 'jigsaw-puzzle', name: 'Jigsaw Puzzle', description: 'Piece together puzzles', emoji: '🧩', category: 'puzzle' },
  { id: 'sliding-puzzle', name: 'Sliding Puzzle', description: '15-puzzle game', emoji: '🎯', category: 'puzzle' },
  { id: 'nonogram', name: 'Nonogram', description: 'Picture logic puzzles', emoji: '🖼️', category: 'puzzle' },
  { id: 'tower-of-hanoi', name: 'Tower of Hanoi', description: 'Classic disk-stacking puzzle', emoji: '🗼', category: 'puzzle' },
  { id: 'lights-out', name: 'Lights Out', description: 'Turn off all lights logic puzzle', emoji: '💡', category: 'puzzle' },
  { id: 'mastermind', name: 'Mastermind', description: 'Color code breaking game', emoji: '🎨', category: 'puzzle' },
  { id: 'maze-runner', name: 'Maze Runner', description: 'Navigate through procedural mazes', emoji: '🗺️', category: 'puzzle' },
  
  // Card Games
  { id: 'solitaire', name: 'Solitaire', description: 'Classic card game', emoji: '🃏', category: 'card' },
  { id: 'blackjack', name: 'Blackjack', description: 'Casino card game', emoji: '♠️', category: 'card' },
  { id: 'video-poker', name: 'Video Poker', description: 'Jacks or Better poker', emoji: '🎰', category: 'card' },
  
  // Strategy Games
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Classic X and O game', emoji: '❌', category: 'strategy' },
  { id: 'connect-four', name: 'Connect Four', description: 'Get four in a row', emoji: '🔴', category: 'strategy' },
  { id: 'minesweeper', name: 'Minesweeper', description: 'Find all the mines', emoji: '💣', category: 'strategy' },
  
  // Arcade Classics
  { id: 'snake', name: 'Snake', description: 'Classic arcade game', emoji: '🐍', category: 'arcade' },
  { id: 'tetris', name: 'Tetris', description: 'Stack falling blocks', emoji: '🧱', category: 'arcade' },
  { id: 'pac-man', name: 'Pac-Man', description: 'Classic maze chase game', emoji: '👻', category: 'arcade' },
  { id: 'space-invaders', name: 'Space Invaders', description: 'Defend Earth from aliens', emoji: '👾', category: 'arcade' },
  { id: 'breakout', name: 'Breakout', description: 'Break all the bricks', emoji: '🧱', category: 'arcade' },
  { id: 'pinball', name: 'Pinball', description: 'Classic arcade pinball', emoji: '🎱', category: 'arcade' },
  { id: 'flappy-bird', name: 'Flappy Bird', description: 'Navigate through pipes', emoji: '🐦', category: 'arcade' },
  { id: 'doodle-jump', name: 'Doodle Jump', description: 'Jump to new heights', emoji: '🎮', category: 'arcade' },
  
  // Skill & Reflex
  { id: 'aim-trainer', name: 'Aim Trainer', description: 'Test your accuracy', emoji: '🎯', category: 'skill' },
  { id: 'typing-test', name: 'Typing Test', description: 'Test your typing speed', emoji: '⌨️', category: 'skill' },
  { id: 'whack-a-mole', name: 'Whack-a-Mole', description: 'Test your reflexes', emoji: '🔨', category: 'skill' },
  { id: 'color-switch', name: 'Color Switch', description: 'Match colors to survive', emoji: '🌈', category: 'skill' },
  
  // Memory Games
  { id: 'memory-match', name: 'Memory Match', description: 'Match the cards', emoji: '🧠', category: 'memory' },
  { id: 'simon-says', name: 'Simon Says', description: 'Memory pattern game', emoji: '🔊', category: 'memory' },
  { id: 'pattern-memory', name: 'Pattern Memory', description: 'Test your memory skills', emoji: '🎨', category: 'memory' },
  
  // Board Games
  { id: 'chess', name: 'Chess', description: 'Strategic board game', emoji: '♟️', category: 'board', minPlayers: 2, maxPlayers: 2 },
  { id: 'checkers', name: 'Checkers', description: 'Classic strategy game', emoji: '⚫', category: 'board', minPlayers: 2, maxPlayers: 2 },
  { id: 'battleship', name: 'Battleship', description: 'Naval strategy game', emoji: '🚢', category: 'board', minPlayers: 2, maxPlayers: 2 },
  
  // Casual Games
  { id: 'stack-tower', name: 'Stack Tower', description: 'Build the tallest tower', emoji: '🏗️', category: 'casual' },
  { id: 'bubble-shooter', name: 'Bubble Shooter', description: 'Match and pop bubbles', emoji: '🫧', category: 'casual' },
  { id: 'wordle', name: 'Wordle', description: 'Guess the 5-letter word', emoji: '📝', category: 'casual' },
  { id: 'hangman', name: 'Hangman', description: 'Guess the word letter by letter', emoji: '📝', category: 'casual' },
  { id: 'bingo', name: 'Bingo', description: 'Classic number matching game', emoji: '🎱', category: 'casual' },
  { id: 'roulette', name: 'Roulette', description: 'Spin the wheel of fortune', emoji: '🎡', category: 'casual' },
  { id: 'mental-math', name: 'Mental Math', description: 'Solve math problems', emoji: '🔢', category: 'casual' }
]