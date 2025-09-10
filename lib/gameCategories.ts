export interface GameCategoryMapping {
  id: string
  name: string
  description: string
  path: string
  category: 'puzzle' | 'action' | 'strategy' | 'arcade' | 'card' | 'memory' | 'skill' | 'casino' | 'word'
  difficulty: 'easy' | 'medium' | 'hard'
  avgPlayTime: number // in minutes
  tags: string[]
}

export const gameCategories: GameCategoryMapping[] = [
  // Quick/Action Games
  { id: 'cps-test', name: 'CPS Test', description: 'Test your clicking speed', path: '/games/cps-test', category: 'action', difficulty: 'easy', avgPlayTime: 1, tags: ['quick', 'reflex', 'clicking'] },
  { id: 'reaction-time', name: 'Reaction Time', description: 'Test your reflexes', path: '/games/reaction-time', category: 'action', difficulty: 'easy', avgPlayTime: 2, tags: ['quick', 'reflex', 'speed'] },
  { id: 'aim-trainer', name: 'Aim Trainer', description: 'Test your accuracy', path: '/games/aim-trainer', category: 'skill', difficulty: 'medium', avgPlayTime: 5, tags: ['accuracy', 'mouse', 'training'] },
  { id: 'whack-a-mole', name: 'Whack-a-Mole', description: 'Test your reflexes', path: '/games/whack-a-mole', category: 'action', difficulty: 'easy', avgPlayTime: 3, tags: ['quick', 'reflex', 'fun'] },
  
  // Memory Games
  { id: 'memory-match', name: 'Memory Match', description: 'Match the cards', path: '/games/memory-match', category: 'memory', difficulty: 'easy', avgPlayTime: 5, tags: ['memory', 'cards', 'matching'] },
  { id: 'simon-says', name: 'Simon Says', description: 'Memory pattern game', path: '/games/simon-says', category: 'memory', difficulty: 'medium', avgPlayTime: 5, tags: ['memory', 'pattern', 'sequence'] },
  { id: 'pattern-memory', name: 'Pattern Memory', description: 'Test your memory skills', path: '/games/pattern-memory', category: 'memory', difficulty: 'medium', avgPlayTime: 5, tags: ['memory', 'pattern', 'visual'] },
  
  // Puzzle Games
  { id: '2048', name: '2048', description: 'Slide tiles to reach 2048', path: '/games/2048', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'numbers', 'sliding'] },
  { id: 'sudoku', name: 'Sudoku', description: 'Number puzzle game', path: '/games/sudoku', category: 'puzzle', difficulty: 'hard', avgPlayTime: 20, tags: ['puzzle', 'numbers', 'logic'] },
  { id: 'minesweeper', name: 'Minesweeper', description: 'Find all the mines', path: '/games/minesweeper', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'logic', 'classic'] },
  { id: 'sliding-puzzle', name: 'Sliding Puzzle', description: 'Classic 15-puzzle game', path: '/games/sliding-puzzle', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'sliding', 'classic'] },
  { id: 'jigsaw', name: 'Jigsaw Puzzle', description: 'Piece together puzzles', path: '/games/jigsaw', category: 'puzzle', difficulty: 'medium', avgPlayTime: 15, tags: ['puzzle', 'pieces', 'visual'] },
  { id: 'nonogram', name: 'Nonogram', description: 'Picture logic puzzles', path: '/games/nonogram', category: 'puzzle', difficulty: 'hard', avgPlayTime: 15, tags: ['puzzle', 'logic', 'picture'] },
  
  // Word Games
  { id: 'typing-test', name: 'Typing Test', description: 'Test your typing speed', path: '/games/typing-test', category: 'skill', difficulty: 'medium', avgPlayTime: 2, tags: ['typing', 'speed', 'keyboard'] },
  { id: 'word-search', name: 'Word Search', description: 'Find hidden words', path: '/games/word-search', category: 'word', difficulty: 'medium', avgPlayTime: 10, tags: ['word', 'search', 'puzzle'] },
  { id: 'crossword', name: 'Crossword', description: 'Word puzzle challenges', path: '/games/crossword', category: 'word', difficulty: 'hard', avgPlayTime: 20, tags: ['word', 'puzzle', 'vocabulary'] },
  { id: 'wordle', name: 'Wordle', description: 'Guess the 5-letter word', path: '/games/wordle', category: 'word', difficulty: 'medium', avgPlayTime: 5, tags: ['word', 'guessing', 'daily'] },
  { id: 'hangman', name: 'Hangman', description: 'Guess the word letter by letter', path: '/games/hangman', category: 'word', difficulty: 'easy', avgPlayTime: 5, tags: ['word', 'guessing', 'classic'] },
  
  // Strategy Games
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Classic X and O game', path: '/games/tic-tac-toe', category: 'strategy', difficulty: 'easy', avgPlayTime: 2, tags: ['strategy', 'classic', '2-player'] },
  { id: 'connect-four', name: 'Connect Four', description: 'Get four in a row', path: '/games/connect-four', category: 'strategy', difficulty: 'medium', avgPlayTime: 5, tags: ['strategy', 'classic', '2-player'] },
  
  // Arcade Games
  { id: 'snake', name: 'Snake', description: 'Classic snake game', path: '/games/snake', category: 'arcade', difficulty: 'easy', avgPlayTime: 5, tags: ['arcade', 'classic', 'snake'] },
  { id: 'tetris', name: 'Tetris', description: 'Stack falling blocks', path: '/games/tetris', category: 'arcade', difficulty: 'medium', avgPlayTime: 10, tags: ['arcade', 'classic', 'blocks'] },
  { id: 'breakout', name: 'Breakout', description: 'Break all the bricks', path: '/games/breakout', category: 'arcade', difficulty: 'medium', avgPlayTime: 10, tags: ['arcade', 'classic', 'paddle'] },
  { id: 'pacman', name: 'Pac-Man', description: 'Classic arcade maze game', path: '/games/pacman', category: 'arcade', difficulty: 'medium', avgPlayTime: 10, tags: ['arcade', 'classic', 'maze'] },
  { id: 'space-invaders', name: 'Space Invaders', description: 'Defend Earth from aliens', path: '/games/space-invaders', category: 'arcade', difficulty: 'medium', avgPlayTime: 10, tags: ['arcade', 'classic', 'shooter'] },
  { id: 'flappy-bird', name: 'Flappy Bird', description: 'Navigate through pipes', path: '/games/flappy-bird', category: 'arcade', difficulty: 'hard', avgPlayTime: 3, tags: ['arcade', 'endless', 'flying'] },
  { id: 'doodle-jump', name: 'Doodle Jump', description: 'Jump to new heights', path: '/games/doodle-jump', category: 'arcade', difficulty: 'medium', avgPlayTime: 5, tags: ['arcade', 'endless', 'jumping'] },
  { id: 'pinball', name: 'Pinball', description: 'Classic arcade pinball', path: '/games/pinball', category: 'arcade', difficulty: 'medium', avgPlayTime: 5, tags: ['arcade', 'classic', 'pinball'] },
  { id: 'bubble-shooter', name: 'Bubble Shooter', description: 'Match and pop bubbles', path: '/games/bubble-shooter', category: 'arcade', difficulty: 'easy', avgPlayTime: 10, tags: ['arcade', 'matching', 'bubbles'] },
  
  // Skill Games
  { id: 'mental-math', name: 'Mental Math', description: 'Solve math problems', path: '/games/mental-math', category: 'skill', difficulty: 'medium', avgPlayTime: 5, tags: ['math', 'education', 'brain'] },
  { id: 'color-switch', name: 'Color Switch', description: 'Match colors to survive', path: '/games/color-switch', category: 'skill', difficulty: 'hard', avgPlayTime: 3, tags: ['skill', 'color', 'timing'] },
  { id: 'stack-tower', name: 'Stack Tower', description: 'Build the tallest tower', path: '/games/stack-tower', category: 'skill', difficulty: 'medium', avgPlayTime: 5, tags: ['skill', 'stacking', 'precision'] },
  
  // Card/Casino Games
  { id: 'solitaire', name: 'Solitaire', description: 'Classic card game', path: '/games/solitaire', category: 'card', difficulty: 'medium', avgPlayTime: 15, tags: ['card', 'classic', 'patience'] },
  { id: 'blackjack', name: 'Blackjack', description: 'Casino card game', path: '/games/blackjack', category: 'casino', difficulty: 'medium', avgPlayTime: 10, tags: ['card', 'casino', 'gambling'] },
  { id: 'video-poker', name: 'Video Poker', description: 'Jacks or Better poker', path: '/games/video-poker', category: 'casino', difficulty: 'medium', avgPlayTime: 10, tags: ['card', 'casino', 'poker'] },
  { id: 'roulette', name: 'Roulette', description: 'Spin the wheel of fortune', path: '/games/roulette', category: 'casino', difficulty: 'easy', avgPlayTime: 5, tags: ['casino', 'wheel', 'gambling'] },
  { id: 'bingo', name: 'Bingo', description: 'Classic number matching game', path: '/games/bingo', category: 'casino', difficulty: 'easy', avgPlayTime: 10, tags: ['casino', 'numbers', 'luck'] },
  
  // New Games (Cycle 21)
  { id: 'dice-roll', name: 'Dice Roll', description: 'Roll dice to hit the target', path: '/games/dice-roll', category: 'casino', difficulty: 'easy', avgPlayTime: 3, tags: ['dice', 'luck', 'quick'] },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', description: 'Classic hand game', path: '/games/rock-paper-scissors', category: 'strategy', difficulty: 'easy', avgPlayTime: 2, tags: ['classic', 'quick', 'strategy'] },
  { id: 'coin-flip', name: 'Coin Flip', description: 'Heads or tails betting', path: '/games/coin-flip', category: 'casino', difficulty: 'easy', avgPlayTime: 1, tags: ['luck', 'betting', 'quick'] },
  { id: 'number-guessing', name: 'Number Guessing', description: 'Guess the secret number', path: '/games/number-guessing', category: 'puzzle', difficulty: 'easy', avgPlayTime: 3, tags: ['guessing', 'numbers', 'logic'] },
  { id: 'maze-runner', name: 'Maze Runner', description: 'Navigate through the maze', path: '/games/maze-runner', category: 'puzzle', difficulty: 'medium', avgPlayTime: 5, tags: ['maze', 'navigation', 'puzzle'] },
  { id: 'tower-of-hanoi', name: 'Tower of Hanoi', description: 'Classic disk puzzle', path: '/games/tower-of-hanoi', category: 'puzzle', difficulty: 'hard', avgPlayTime: 10, tags: ['puzzle', 'classic', 'logic'] },
  { id: 'lights-out', name: 'Lights Out', description: 'Turn off all the lights', path: '/games/lights-out', category: 'puzzle', difficulty: 'medium', avgPlayTime: 5, tags: ['puzzle', 'logic', 'lights'] },
  { id: 'mastermind', name: 'Mastermind', description: 'Break the color code', path: '/games/mastermind', category: 'puzzle', difficulty: 'hard', avgPlayTime: 10, tags: ['puzzle', 'code', 'colors'] },
  
  // New Games (Cycle 23)
  { id: 'trivia-challenge', name: 'Trivia Challenge', description: 'Test your knowledge across categories', path: '/games/trivia-challenge', category: 'word', difficulty: 'medium', avgPlayTime: 10, tags: ['quiz', 'trivia', 'knowledge'] },
  { id: 'asteroid-shooter', name: 'Asteroid Shooter', description: 'Destroy asteroids in space', path: '/games/asteroid-shooter', category: 'action', difficulty: 'medium', avgPlayTime: 10, tags: ['space', 'shooter', 'arcade'] },
  { id: 'mini-golf', name: 'Mini Golf', description: 'Play through 9 challenging holes', path: '/games/mini-golf', category: 'skill', difficulty: 'easy', avgPlayTime: 15, tags: ['sports', 'golf', 'precision'] },
  { id: 'kakuro', name: 'Kakuro', description: 'Number crossword puzzle', path: '/games/kakuro', category: 'puzzle', difficulty: 'hard', avgPlayTime: 20, tags: ['numbers', 'logic', 'math'] },
  { id: 'spider-solitaire', name: 'Spider Solitaire', description: 'Classic spider card game', path: '/games/spider-solitaire', category: 'card', difficulty: 'medium', avgPlayTime: 20, tags: ['solitaire', 'cards', 'strategy'] },
  
  // New Games (Cycle 26)
  { id: 'chess', name: 'Chess', description: 'Ultimate strategy game', path: '/games/chess', category: 'strategy', difficulty: 'hard', avgPlayTime: 30, tags: ['strategy', 'board', 'classic'] },
  { id: 'checkers', name: 'Checkers', description: 'Classic board game', path: '/games/checkers', category: 'strategy', difficulty: 'medium', avgPlayTime: 15, tags: ['strategy', 'board', 'classic'] },
  { id: 'reversi', name: 'Reversi/Othello', description: 'Flip discs to win', path: '/games/reversi', category: 'strategy', difficulty: 'medium', avgPlayTime: 15, tags: ['strategy', 'board', 'othello'] },
  { id: 'backgammon', name: 'Backgammon', description: 'Ancient dice and strategy', path: '/games/backgammon', category: 'strategy', difficulty: 'hard', avgPlayTime: 20, tags: ['strategy', 'board', 'dice'] },
  { id: 'go-fish', name: 'Go Fish', description: 'Classic card matching', path: '/games/go-fish', category: 'card', difficulty: 'easy', avgPlayTime: 10, tags: ['card', 'matching', 'family'] },
  { id: 'war', name: 'War', description: 'Simple card battle', path: '/games/war', category: 'card', difficulty: 'easy', avgPlayTime: 10, tags: ['card', 'simple', 'luck'] },
  { id: 'crazy-eights', name: 'Crazy Eights', description: 'Wild card game', path: '/games/crazy-eights', category: 'card', difficulty: 'medium', avgPlayTime: 15, tags: ['card', 'uno-like', 'strategy'] },
  { id: 'hearts', name: 'Hearts', description: 'Trick-taking card game', path: '/games/hearts', category: 'card', difficulty: 'hard', avgPlayTime: 20, tags: ['card', 'tricks', 'strategy'] },
  { id: 'spades', name: 'Spades', description: 'Partnership card game', path: '/games/spades', category: 'card', difficulty: 'hard', avgPlayTime: 25, tags: ['card', 'partnership', 'bidding'] },
  
  // New Games (Cycle 27 - 15 new games)
  // Puzzle Games
  { id: 'mahjong-solitaire', name: 'Mahjong Solitaire', description: 'Classic tile matching with multiple layouts', path: '/games/mahjong-solitaire', category: 'puzzle', difficulty: 'medium', avgPlayTime: 15, tags: ['puzzle', 'matching', 'tiles'] },
  { id: 'flow-free', name: 'Flow Free', description: 'Connect matching colors without crossing paths', path: '/games/flow-free', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'flow', 'logic'] },
  { id: 'tangram', name: 'Tangram', description: 'Shape arrangement puzzle', path: '/games/tangram', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'shapes', 'spatial'] },
  { id: 'pipes', name: 'Pipes', description: 'Connect pipes to create flow', path: '/games/pipes', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'pipes', 'rotation'] },
  { id: 'hexagon', name: 'Hexagon', description: 'Fit hexagonal pieces together', path: '/games/hexagon', category: 'puzzle', difficulty: 'hard', avgPlayTime: 15, tags: ['puzzle', 'hexagon', 'tetris-like'] },
  
  // Action Games
  { id: 'fruit-ninja', name: 'Fruit Ninja', description: 'Swipe to slice fruits', path: '/games/fruit-ninja', category: 'action', difficulty: 'easy', avgPlayTime: 5, tags: ['action', 'swipe', 'fruits'] },
  { id: 'temple-run', name: 'Temple Run', description: 'Endless runner with obstacles', path: '/games/temple-run', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['action', 'endless', 'runner'] },
  { id: 'angry-birds', name: 'Angry Birds', description: 'Physics-based projectile game', path: '/games/angry-birds', category: 'action', difficulty: 'medium', avgPlayTime: 10, tags: ['action', 'physics', 'projectile'] },
  { id: 'geometry-dash', name: 'Geometry Dash', description: 'Rhythm-based platformer', path: '/games/geometry-dash', category: 'action', difficulty: 'hard', avgPlayTime: 5, tags: ['action', 'rhythm', 'platformer'] },
  { id: 'tank-battle', name: 'Tank Battle', description: 'Top-down shooter', path: '/games/tank-battle', category: 'action', difficulty: 'medium', avgPlayTime: 10, tags: ['action', 'shooter', 'tanks'] },
  
  // Classic Games
  { id: 'dominoes', name: 'Dominoes', description: 'Traditional tile game', path: '/games/dominoes', category: 'strategy', difficulty: 'medium', avgPlayTime: 15, tags: ['classic', 'tiles', 'strategy'] },
  { id: 'yahtzee', name: 'Yahtzee', description: 'Dice game with scoring combinations', path: '/games/yahtzee', category: 'casino', difficulty: 'medium', avgPlayTime: 15, tags: ['dice', 'scoring', 'classic'] },
  { id: 'boggle', name: 'Boggle', description: 'Word finding in letter grid', path: '/games/boggle', category: 'word', difficulty: 'medium', avgPlayTime: 5, tags: ['word', 'letters', 'search'] },
  { id: 'scrabble', name: 'Scrabble', description: 'Word building with letter values', path: '/games/scrabble', category: 'word', difficulty: 'hard', avgPlayTime: 30, tags: ['word', 'letters', 'strategy'] },
  { id: 'risk', name: 'Risk', description: 'Territory conquest strategy', path: '/games/risk', category: 'strategy', difficulty: 'hard', avgPlayTime: 45, tags: ['strategy', 'conquest', 'war'] },
]

// Helper function to get games by category
export function getGamesByCategory(category: string): GameCategoryMapping[] {
  return gameCategories.filter(game => game.category === category)
}

// Helper function to get all unique categories
export function getAllCategories(): string[] {
  return [...new Set(gameCategories.map(game => game.category))]
}

// Helper function to search games
export function searchGames(query: string): GameCategoryMapping[] {
  const lowerQuery = query.toLowerCase()
  return gameCategories.filter(game => 
    game.name.toLowerCase().includes(lowerQuery) ||
    game.description.toLowerCase().includes(lowerQuery) ||
    game.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}