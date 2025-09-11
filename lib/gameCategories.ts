export type GameCategory = 'puzzle' | 'action' | 'strategy' | 'arcade' | 'card' | 'memory' | 'skill' | 'casino' | 'word' | 'music' | 'physics' | 'simulation'
export type GameDifficulty = 'easy' | 'medium' | 'hard'

export interface GameCategoryMapping {
  id: string
  name: string
  description: string
  path: string
  category: GameCategory // Primary category for backward compatibility
  categories?: { category: GameCategory; relevance: number }[] // Multi-category support with weights
  difficulty: GameDifficulty
  avgPlayTime: number // in minutes
  tags: string[]
  rating?: number // User rating (1-5)
  playCount?: number // Number of times played
  lastUpdated?: Date // Last update timestamp
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
  { id: 'jigsaw-puzzle', name: 'Jigsaw Puzzle', description: 'Piece together puzzles', path: '/games/jigsaw-puzzle', category: 'puzzle', difficulty: 'medium', avgPlayTime: 15, tags: ['puzzle', 'pieces', 'visual'] },
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
  
  // Multiplayer Games (Cycle 29)
  { id: 'pool', name: 'Pool (8-Ball)', description: 'Classic billiards with physics', path: '/games/pool', category: 'skill', difficulty: 'medium', avgPlayTime: 15, tags: ['billiards', 'physics', 'multiplayer'] },
  { id: 'battleship', name: 'Battleship', description: 'Naval strategy game', path: '/games/battleship', category: 'strategy', difficulty: 'medium', avgPlayTime: 20, tags: ['strategy', 'naval', 'multiplayer'] },
  { id: 'air-hockey', name: 'Air Hockey', description: 'Fast-paced table game', path: '/games/air-hockey', category: 'arcade', difficulty: 'easy', avgPlayTime: 5, tags: ['arcade', 'fast', 'multiplayer'] },
  
  // Educational Games (Cycle 30)
  { id: 'geography-quiz', name: 'Geography Quiz', description: 'World capitals and flags challenge', path: '/games/geography-quiz', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['education', 'geography', 'quiz'] },
  { id: 'math-blaster', name: 'Math Blaster', description: 'Speed arithmetic challenges', path: '/games/math-blaster', category: 'skill', difficulty: 'medium', avgPlayTime: 5, tags: ['education', 'math', 'speed'] },
  { id: 'chemistry-lab', name: 'Chemistry Lab', description: 'Element matching and compounds', path: '/games/chemistry-lab', category: 'puzzle', difficulty: 'hard', avgPlayTime: 15, tags: ['education', 'science', 'chemistry'] },
  { id: 'history-timeline', name: 'History Timeline', description: 'Event ordering and dates', path: '/games/history-timeline', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['education', 'history', 'timeline'] },
  { id: 'language-match', name: 'Language Match', description: 'Vocabulary and translations', path: '/games/language-match', category: 'word', difficulty: 'medium', avgPlayTime: 10, tags: ['education', 'language', 'vocabulary'] },
  { id: 'science-trivia', name: 'Science Trivia', description: 'STEM knowledge quiz', path: '/games/science-trivia', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['education', 'science', 'trivia'] },
  
  // Sports Games (Cycle 30)
  { id: 'basketball-shootout', name: 'Basketball Shootout', description: 'Free throw accuracy challenge', path: '/games/basketball-shootout', category: 'skill', difficulty: 'easy', avgPlayTime: 5, tags: ['sports', 'basketball', 'accuracy'] },
  { id: 'soccer-penalty', name: 'Soccer Penalty', description: 'Penalty kick goalkeeper duel', path: '/games/soccer-penalty', category: 'skill', difficulty: 'medium', avgPlayTime: 5, tags: ['sports', 'soccer', 'penalty'] },
  { id: 'baseball-homerun', name: 'Baseball Home Run', description: 'Batting practice derby', path: '/games/baseball-homerun', category: 'skill', difficulty: 'medium', avgPlayTime: 5, tags: ['sports', 'baseball', 'batting'] },
  { id: 'golf-putting', name: 'Golf Putting', description: 'Mini putting with physics', path: '/games/golf-putting', category: 'skill', difficulty: 'medium', avgPlayTime: 10, tags: ['sports', 'golf', 'precision'] },
  { id: 'tennis-rally', name: 'Tennis Rally', description: 'Volley survival endurance', path: '/games/tennis-rally', category: 'skill', difficulty: 'hard', avgPlayTime: 5, tags: ['sports', 'tennis', 'endurance'] },
  { id: 'boxing-match', name: 'Boxing Match', description: 'Timing-based combat', path: '/games/boxing-match', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['sports', 'boxing', 'combat'] },
  
  // Arcade Classics (Cycle 30)
  { id: 'centipede', name: 'Centipede', description: 'Mushroom field shooter', path: '/games/centipede', category: 'arcade', difficulty: 'medium', avgPlayTime: 10, tags: ['arcade', 'classic', 'shooter'] },
  { id: 'frogger', name: 'Frogger', description: 'Traffic crossing survival', path: '/games/frogger', category: 'arcade', difficulty: 'medium', avgPlayTime: 5, tags: ['arcade', 'classic', 'crossing'] },
  { id: 'galaga', name: 'Galaga', description: 'Formation space shooter', path: '/games/galaga', category: 'arcade', difficulty: 'medium', avgPlayTime: 10, tags: ['arcade', 'classic', 'space'] },
  { id: 'dig-dug', name: 'Dig Dug', description: 'Underground monster hunter', path: '/games/dig-dug', category: 'arcade', difficulty: 'medium', avgPlayTime: 10, tags: ['arcade', 'classic', 'underground'] },
  { id: 'qbert', name: 'Q*bert', description: 'Isometric pyramid hopper', path: '/games/qbert', category: 'arcade', difficulty: 'hard', avgPlayTime: 10, tags: ['arcade', 'classic', 'isometric'] },
  { id: 'defender', name: 'Defender', description: 'Horizontal space defender', path: '/games/defender', category: 'arcade', difficulty: 'hard', avgPlayTime: 10, tags: ['arcade', 'classic', 'defender'] },
  
  // Board Games (Cycle 30)
  { id: 'chess-puzzles', name: 'Chess Puzzles', description: 'Daily tactical challenges', path: '/games/chess-puzzles', category: 'strategy', difficulty: 'hard', avgPlayTime: 10, tags: ['chess', 'puzzle', 'tactics'] },
  { id: 'shogi', name: 'Shogi', description: 'Japanese chess variant', path: '/games/shogi', category: 'strategy', difficulty: 'hard', avgPlayTime: 30, tags: ['board', 'japanese', 'strategy'] },
  { id: 'xiangqi', name: 'Xiangqi', description: 'Chinese chess strategy', path: '/games/xiangqi', category: 'strategy', difficulty: 'hard', avgPlayTime: 30, tags: ['board', 'chinese', 'strategy'] },
  { id: 'othello-advanced', name: 'Othello Advanced', description: 'Enhanced reversi gameplay', path: '/games/othello-advanced', category: 'strategy', difficulty: 'medium', avgPlayTime: 15, tags: ['board', 'reversi', 'strategy'] },
  { id: 'mancala', name: 'Mancala', description: 'Ancient counting strategy', path: '/games/mancala', category: 'strategy', difficulty: 'medium', avgPlayTime: 15, tags: ['board', 'ancient', 'counting'] },
  { id: 'nine-mens-morris', name: 'Nine Men\'s Morris', description: 'Mill formation tactics', path: '/games/nine-mens-morris', category: 'strategy', difficulty: 'medium', avgPlayTime: 20, tags: ['board', 'mills', 'strategy'] },
  
  // New Action Games
  { id: 'ninja-jump', name: 'Ninja Jump', description: 'Wall-jumping platformer', path: '/games/ninja-jump', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['action', 'platformer', 'ninja'] },
  { id: 'laser-maze', name: 'Laser Maze', description: 'Navigate through laser obstacles', path: '/games/laser-maze', category: 'action', difficulty: 'hard', avgPlayTime: 10, tags: ['action', 'puzzle', 'maze'] },
  { id: 'speed-racer', name: 'Speed Racer', description: 'Quick reaction racing game', path: '/games/speed-racer', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['action', 'racing', 'reflex'] },
  { id: 'asteroid-dodger', name: 'Asteroid Dodger', description: 'Space obstacle avoidance', path: '/games/asteroid-dodger', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['action', 'space', 'survival'] },
  { id: 'rapid-fire', name: 'Rapid Fire', description: 'Quick shooting gallery', path: '/games/rapid-fire', category: 'action', difficulty: 'easy', avgPlayTime: 3, tags: ['action', 'shooting', 'accuracy'] },
  
  // New Strategy Games
  { id: 'tower-defense', name: 'Tower Defense Lite', description: 'Simple tower defense with waves of enemies', path: '/games/tower-defense', category: 'strategy', difficulty: 'medium', avgPlayTime: 15, tags: ['strategy', 'tower-defense', 'waves'] },
  { id: 'territory-control', name: 'Territory Control', description: 'Area domination strategy game', path: '/games/territory-control', category: 'strategy', difficulty: 'medium', avgPlayTime: 20, tags: ['strategy', 'conquest', 'territory'] },
  { id: 'resource-manager', name: 'Resource Manager', description: 'Economic strategy with resource collection', path: '/games/resource-manager', category: 'strategy', difficulty: 'hard', avgPlayTime: 15, tags: ['strategy', 'economy', 'management'] },
  { id: 'battle-tactics', name: 'Battle Tactics', description: 'Turn-based tactical combat', path: '/games/battle-tactics', category: 'strategy', difficulty: 'hard', avgPlayTime: 20, tags: ['strategy', 'tactical', 'turn-based'] },
  { id: 'maze-escape', name: 'Maze Escape', description: 'Strategic maze navigation with limited moves', path: '/games/maze-escape', category: 'strategy', difficulty: 'medium', avgPlayTime: 10, tags: ['strategy', 'maze', 'puzzle'] },
  
  // New Puzzle Games (Cycle 31)
  { id: 'block-blast', name: 'Block Blast', description: 'Clear lines by filling rows', path: '/games/block-blast', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'blocks', 'clearing'] },
  { id: 'color-match', name: 'Color Match', description: 'Pattern matching with colors', path: '/games/color-match', category: 'puzzle', difficulty: 'medium', avgPlayTime: 8, tags: ['puzzle', 'colors', 'matching'] },
  { id: 'logic-grid', name: 'Logic Grid', description: 'Grid-based logic puzzles', path: '/games/logic-grid', category: 'puzzle', difficulty: 'hard', avgPlayTime: 15, tags: ['puzzle', 'logic', 'deduction'] },
  { id: 'rotate-puzzle', name: 'Rotate Puzzle', description: 'Rotation-based puzzle solving', path: '/games/rotate-puzzle', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'rotation', 'paths'] },
  { id: 'bridge-builder', name: 'Bridge Builder', description: 'Physics construction puzzle', path: '/games/bridge-builder', category: 'puzzle', difficulty: 'hard', avgPlayTime: 20, tags: ['puzzle', 'physics', 'construction'] },

  // Casual Games (Final 5)
  { id: 'bubble-pop', name: 'Bubble Pop', description: 'Simple bubble popping game with chain reactions', path: '/games/bubble-pop', category: 'arcade', difficulty: 'easy', avgPlayTime: 5, tags: ['casual', 'bubbles', 'relaxing'] },
  { id: 'match-three', name: 'Match Three', description: 'Classic match-3 gameplay with combos', path: '/games/match-three', category: 'puzzle', difficulty: 'easy', avgPlayTime: 10, tags: ['casual', 'matching', 'gems'] },
  { id: 'idle-clicker', name: 'Idle Clicker', description: 'Incremental clicking game with upgrades', path: '/games/idle-clicker', category: 'arcade', difficulty: 'easy', avgPlayTime: 15, tags: ['casual', 'idle', 'upgrades'] },
  { id: 'ball-bounce', name: 'Ball Bounce', description: 'Physics-based bouncing ball game', path: '/games/ball-bounce', category: 'arcade', difficulty: 'medium', avgPlayTime: 5, tags: ['casual', 'physics', 'bouncing'] },
  { id: 'color-fill', name: 'Color Fill', description: 'Fill the screen color puzzle', path: '/games/color-fill', category: 'puzzle', difficulty: 'easy', avgPlayTime: 8, tags: ['casual', 'colors', 'filling'] },

  // Cycle 34: New Multiplayer Games (10 games)
  { 
    id: 'online-poker', 
    name: 'Online Poker', 
    description: 'Play Texas Hold\'em poker online with friends', 
    path: '/games/online-poker', 
    category: 'card',
    categories: [
      { category: 'card', relevance: 1.0 },
      { category: 'casino', relevance: 0.9 },
      { category: 'strategy', relevance: 0.7 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 30, 
    tags: ['multiplayer', 'poker', 'cards', 'strategy', 'betting', 'online'] 
  },
  { 
    id: 'online-uno', 
    name: 'Online UNO', 
    description: 'Classic UNO card game with multiplayer support', 
    path: '/games/online-uno', 
    category: 'card',
    categories: [
      { category: 'card', relevance: 1.0 },
      { category: 'strategy', relevance: 0.5 }
    ],
    difficulty: 'easy', 
    avgPlayTime: 15, 
    tags: ['multiplayer', 'uno', 'cards', 'family', 'online'] 
  },
  { 
    id: 'online-scrabble', 
    name: 'Online Scrabble', 
    description: 'Word building game with online multiplayer', 
    path: '/games/online-scrabble', 
    category: 'word',
    categories: [
      { category: 'word', relevance: 1.0 },
      { category: 'strategy', relevance: 0.8 },
      { category: 'puzzle', relevance: 0.6 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 45, 
    tags: ['multiplayer', 'scrabble', 'words', 'vocabulary', 'strategy', 'online'] 
  },
  { 
    id: 'online-dominoes', 
    name: 'Online Dominoes', 
    description: 'Traditional dominoes with online play', 
    path: '/games/online-dominoes', 
    category: 'strategy',
    categories: [
      { category: 'strategy', relevance: 1.0 },
      { category: 'puzzle', relevance: 0.5 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 20, 
    tags: ['multiplayer', 'dominoes', 'tiles', 'strategy', 'classic', 'online'] 
  },
  { 
    id: 'online-yahtzee', 
    name: 'Online Yahtzee', 
    description: 'Dice game with scoring combinations online', 
    path: '/games/online-yahtzee', 
    category: 'casino',
    categories: [
      { category: 'casino', relevance: 1.0 },
      { category: 'strategy', relevance: 0.6 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 20, 
    tags: ['multiplayer', 'yahtzee', 'dice', 'probability', 'online'] 
  },
  { 
    id: 'online-battleship-ii', 
    name: 'Online Battleship II', 
    description: 'Enhanced naval combat with special abilities', 
    path: '/games/online-battleship-ii', 
    category: 'strategy',
    categories: [
      { category: 'strategy', relevance: 1.0 },
      { category: 'puzzle', relevance: 0.4 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 25, 
    tags: ['multiplayer', 'battleship', 'naval', 'strategy', 'enhanced', 'online'] 
  },
  { 
    id: 'online-connect-five', 
    name: 'Online Connect Five', 
    description: 'Get five in a row in this strategic game', 
    path: '/games/online-connect-five', 
    category: 'strategy',
    categories: [
      { category: 'strategy', relevance: 1.0 },
      { category: 'puzzle', relevance: 0.5 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 15, 
    tags: ['multiplayer', 'connect', 'strategy', 'gomoku', 'online'] 
  },
  { 
    id: 'online-othello', 
    name: 'Online Othello', 
    description: 'Reversi game with online multiplayer', 
    path: '/games/online-othello', 
    category: 'strategy',
    categories: [
      { category: 'strategy', relevance: 1.0 },
      { category: 'puzzle', relevance: 0.6 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 20, 
    tags: ['multiplayer', 'othello', 'reversi', 'strategy', 'board', 'online'] 
  },
  { 
    id: 'online-stratego', 
    name: 'Online Stratego', 
    description: 'Military strategy with hidden pieces', 
    path: '/games/online-stratego', 
    category: 'strategy',
    categories: [
      { category: 'strategy', relevance: 1.0 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 40, 
    tags: ['multiplayer', 'stratego', 'military', 'strategy', 'tactics', 'online'] 
  },
  { 
    id: 'online-risk', 
    name: 'Online Risk', 
    description: 'World domination strategy game online', 
    path: '/games/online-risk', 
    category: 'strategy',
    categories: [
      { category: 'strategy', relevance: 1.0 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 60, 
    tags: ['multiplayer', 'risk', 'conquest', 'strategy', 'war', 'online'] 
  },

  // Cycle 34: New Puzzle Games (10 games)
  { 
    id: 'rubiks-cube', 
    name: 'Rubik\'s Cube', 
    description: '3D cube puzzle solver', 
    path: '/games/rubiks-cube', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 },
      { category: 'skill', relevance: 0.7 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 15, 
    tags: ['puzzle', '3d', 'cube', 'logic', 'spatial'] 
  },
  { 
    id: 'tower-blocks', 
    name: 'Tower Blocks', 
    description: 'Stack blocks to build tall towers', 
    path: '/games/tower-blocks', 
    category: 'skill',
    categories: [
      { category: 'skill', relevance: 1.0 },
      { category: 'arcade', relevance: 0.7 },
      { category: 'puzzle', relevance: 0.5 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 5, 
    tags: ['stacking', 'tower', 'precision', 'timing', 'building'] 
  },
  { 
    id: 'unblock-me', 
    name: 'Unblock Me', 
    description: 'Slide blocks to free the red block', 
    path: '/games/unblock-me', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 },
      { category: 'strategy', relevance: 0.5 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 10, 
    tags: ['puzzle', 'sliding', 'blocks', 'logic', 'brain-teaser'] 
  },
  { 
    id: 'flow-connect', 
    name: 'Flow Connect', 
    description: 'Connect matching colors without crossing', 
    path: '/games/flow-connect', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 },
      { category: 'strategy', relevance: 0.4 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 10, 
    tags: ['puzzle', 'flow', 'pipes', 'logic', 'colors'] 
  },
  { 
    id: 'hex-puzzle', 
    name: 'Hex Puzzle', 
    description: 'Fit hexagonal pieces into the grid', 
    path: '/games/hex-puzzle', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 },
      { category: 'arcade', relevance: 0.5 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 10, 
    tags: ['puzzle', 'hexagon', 'tetris-like', 'shapes', 'fitting'] 
  },
  { 
    id: 'magic-square', 
    name: 'Magic Square', 
    description: 'Arrange numbers for equal sums', 
    path: '/games/magic-square', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 },
      { category: 'skill', relevance: 0.6 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 15, 
    tags: ['puzzle', 'math', 'numbers', 'logic', 'brain-training'] 
  },
  { 
    id: 'kenken', 
    name: 'KenKen', 
    description: 'Mathematical logic puzzle with operations', 
    path: '/games/kenken', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 },
      { category: 'skill', relevance: 0.7 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 20, 
    tags: ['puzzle', 'math', 'arithmetic', 'logic', 'sudoku-like'] 
  },
  { 
    id: 'hashi', 
    name: 'Hashi (Bridges)', 
    description: 'Connect islands with bridges', 
    path: '/games/hashi', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 },
      { category: 'strategy', relevance: 0.5 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 15, 
    tags: ['puzzle', 'bridges', 'islands', 'logic', 'japanese'] 
  },
  { 
    id: 'slitherlink', 
    name: 'Slitherlink', 
    description: 'Create a loop following number clues', 
    path: '/games/slitherlink', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 20, 
    tags: ['puzzle', 'loop', 'logic', 'japanese', 'deduction'] 
  },
  { 
    id: 'nurikabe', 
    name: 'Nurikabe', 
    description: 'Create islands and walls with logic', 
    path: '/games/nurikabe', 
    category: 'puzzle',
    categories: [
      { category: 'puzzle', relevance: 1.0 }
    ],
    difficulty: 'hard', 
    avgPlayTime: 20, 
    tags: ['puzzle', 'islands', 'walls', 'logic', 'japanese'] 
  },

  // Cycle 34: New Action Games (10 games)
  { 
    id: 'subway-runner', 
    name: 'Subway Runner', 
    description: 'Endless runner through subway tunnels', 
    path: '/games/subway-runner', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'arcade', relevance: 0.8 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 5, 
    tags: ['action', 'runner', 'endless', 'subway', 'dodge'] 
  },
  { 
    id: 'fruit-slice', 
    name: 'Fruit Slice', 
    description: 'Slice flying fruits with swipes', 
    path: '/games/fruit-slice', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'arcade', relevance: 0.7 },
      { category: 'skill', relevance: 0.6 }
    ],
    difficulty: 'easy', 
    avgPlayTime: 5, 
    tags: ['action', 'slicing', 'fruits', 'ninja', 'arcade'] 
  },
  { 
    id: 'tower-climb', 
    name: 'Tower Climb', 
    description: 'Climb an endless tower platform game', 
    path: '/games/tower-climb', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'arcade', relevance: 0.6 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 5, 
    tags: ['action', 'climbing', 'platform', 'vertical', 'endless'] 
  },
  { 
    id: 'laser-quest', 
    name: 'Laser Quest', 
    description: 'Navigate laser mazes and hit targets', 
    path: '/games/laser-quest', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'puzzle', relevance: 0.7 },
      { category: 'skill', relevance: 0.6 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 10, 
    tags: ['action', 'laser', 'puzzle', 'precision', 'maze'] 
  },
  { 
    id: 'ninja-run', 
    name: 'Ninja Run', 
    description: 'Fast-paced ninja platformer', 
    path: '/games/ninja-run', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'arcade', relevance: 0.7 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 5, 
    tags: ['action', 'ninja', 'platform', 'runner', 'combat'] 
  },
  { 
    id: 'space-fighter', 
    name: 'Space Fighter', 
    description: 'Galactic spaceship combat', 
    path: '/games/space-fighter', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'arcade', relevance: 0.8 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 10, 
    tags: ['action', 'space', 'shooter', 'combat', 'upgrades'] 
  },
  { 
    id: 'ball-jump', 
    name: 'Ball Jump', 
    description: 'Bounce through platforms and obstacles', 
    path: '/games/ball-jump', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'arcade', relevance: 0.7 },
      { category: 'skill', relevance: 0.5 }
    ],
    difficulty: 'easy', 
    avgPlayTime: 5, 
    tags: ['action', 'jumping', 'bouncing', 'platform', 'casual'] 
  },
  { 
    id: 'speed-boat', 
    name: 'Speed Boat', 
    description: 'Water racing with obstacles', 
    path: '/games/speed-boat', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'arcade', relevance: 0.6 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 5, 
    tags: ['action', 'racing', 'boat', 'water', 'speed'] 
  },
  { 
    id: 'arrow-master', 
    name: 'Arrow Master', 
    description: 'Archery precision shooting', 
    path: '/games/arrow-master', 
    category: 'skill',
    categories: [
      { category: 'skill', relevance: 1.0 },
      { category: 'action', relevance: 0.7 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 5, 
    tags: ['skill', 'archery', 'shooting', 'precision', 'targets'] 
  },
  { 
    id: 'boxing-champion', 
    name: 'Boxing Champion', 
    description: 'Fighting game with combos', 
    path: '/games/boxing-champion', 
    category: 'action',
    categories: [
      { category: 'action', relevance: 1.0 },
      { category: 'skill', relevance: 0.6 }
    ],
    difficulty: 'medium', 
    avgPlayTime: 10, 
    tags: ['action', 'boxing', 'fighting', 'combat', 'sports'] 
  },

  // Music Games (New Category - Cycle 32)
  { id: 'piano-tiles', name: 'Piano Tiles', description: 'Tap falling tiles in rhythm', path: '/games/piano-tiles', category: 'music', difficulty: 'medium', avgPlayTime: 5, tags: ['music', 'rhythm', 'reflex'] },
  { id: 'beat-matcher', name: 'Beat Matcher', description: 'Match beats to music patterns', path: '/games/beat-matcher', category: 'music', difficulty: 'medium', avgPlayTime: 5, tags: ['music', 'rhythm', 'timing'] },
  { id: 'melody-memory', name: 'Melody Memory', description: 'Remember and replay musical sequences', path: '/games/melody-memory', category: 'music', difficulty: 'hard', avgPlayTime: 10, tags: ['music', 'memory', 'notes'] },
  { id: 'drum-machine', name: 'Drum Machine', description: 'Create beats with virtual drums', path: '/games/drum-machine', category: 'music', difficulty: 'easy', avgPlayTime: 10, tags: ['music', 'drums', 'creative'] },
  { id: 'pitch-perfect', name: 'Pitch Perfect', description: 'Identify musical notes and intervals', path: '/games/pitch-perfect', category: 'music', difficulty: 'hard', avgPlayTime: 10, tags: ['music', 'notes', 'education'] },
  { id: 'rhythm-runner', name: 'Rhythm Runner', description: 'Platformer synchronized to music beats', path: '/games/rhythm-runner', category: 'music', difficulty: 'medium', avgPlayTime: 5, tags: ['music', 'platform', 'rhythm'] },

  // Physics Games (New Category - Cycle 32)
  { id: 'gravity-well', name: 'Gravity Well', description: 'Manipulate gravity to guide objects', path: '/games/gravity-well', category: 'physics', difficulty: 'medium', avgPlayTime: 10, tags: ['physics', 'gravity', 'space'] },
  { id: 'pendulum-swing', name: 'Pendulum Swing', description: 'Physics-based swinging mechanics', path: '/games/pendulum-swing', category: 'physics', difficulty: 'hard', avgPlayTime: 5, tags: ['physics', 'swing', 'timing'] },
  { id: 'balloon-pop-physics', name: 'Balloon Pop Physics', description: 'Air pressure and wind physics', path: '/games/balloon-pop-physics', category: 'physics', difficulty: 'easy', avgPlayTime: 5, tags: ['physics', 'balloons', 'wind'] },
  { id: 'domino-chain', name: 'Domino Chain', description: 'Create chain reactions with physics', path: '/games/domino-chain', category: 'physics', difficulty: 'medium', avgPlayTime: 10, tags: ['physics', 'chain', 'puzzle'] },
  { id: 'marble-maze', name: 'Marble Maze', description: 'Tilt-controlled marble navigation', path: '/games/marble-maze', category: 'physics', difficulty: 'medium', avgPlayTime: 5, tags: ['physics', 'maze', 'tilt'] },
  { id: 'catapult-challenge', name: 'Catapult Challenge', description: 'Projectile physics with trajectory', path: '/games/catapult-challenge', category: 'physics', difficulty: 'medium', avgPlayTime: 5, tags: ['physics', 'projectile', 'aim'] },

  // Simulation Games (New Category - Cycle 32)
  { id: 'city-builder-mini', name: 'City Builder Mini', description: 'Simplified urban planning', path: '/games/city-builder-mini', category: 'simulation', difficulty: 'medium', avgPlayTime: 20, tags: ['simulation', 'city', 'building'] },
  { id: 'farm-manager', name: 'Farm Manager', description: 'Quick agricultural simulation', path: '/games/farm-manager', category: 'simulation', difficulty: 'easy', avgPlayTime: 15, tags: ['simulation', 'farm', 'management'] },
  { id: 'traffic-controller', name: 'Traffic Controller', description: 'Intersection traffic management', path: '/games/traffic-controller', category: 'simulation', difficulty: 'hard', avgPlayTime: 10, tags: ['simulation', 'traffic', 'timing'] },
  { id: 'ecosystem-balance', name: 'Ecosystem Balance', description: 'Simple predator-prey dynamics', path: '/games/ecosystem-balance', category: 'simulation', difficulty: 'medium', avgPlayTime: 15, tags: ['simulation', 'nature', 'balance'] },

  // Enhanced Action Games (Cycle 32)
  { id: 'parkour-runner', name: 'Parkour Runner', description: 'Advanced obstacle course navigation', path: '/games/parkour-runner', category: 'action', difficulty: 'hard', avgPlayTime: 5, tags: ['action', 'parkour', 'runner'] },
  { id: 'laser-tag', name: 'Laser Tag', description: 'Strategic laser-based combat', path: '/games/laser-tag', category: 'action', difficulty: 'medium', avgPlayTime: 10, tags: ['action', 'laser', 'strategy'] },
  { id: 'rocket-dodge', name: 'Rocket Dodge', description: 'Space debris avoidance with upgrades', path: '/games/rocket-dodge', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['action', 'space', 'dodge'] },
  { id: 'storm-chaser', name: 'Storm Chaser', description: 'Weather navigation and timing', path: '/games/storm-chaser', category: 'action', difficulty: 'hard', avgPlayTime: 10, tags: ['action', 'weather', 'survival'] },
  { id: 'neon-racing', name: 'Neon Racing', description: 'Tron-style racing with power-ups', path: '/games/neon-racing', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['action', 'racing', 'neon'] },

  // Advanced Puzzle Games (Cycle 32)
  { id: 'circuit-builder', name: 'Circuit Builder', description: 'Logic gate and electrical puzzles', path: '/games/circuit-builder', category: 'puzzle', difficulty: 'hard', avgPlayTime: 15, tags: ['puzzle', 'logic', 'circuits'] },
  { id: 'water-flow', name: 'Water Flow', description: 'Hydraulic path-finding puzzles', path: '/games/water-flow', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'water', 'flow'] },
  { id: 'mirror-maze', name: 'Mirror Maze', description: 'Light reflection and redirection', path: '/games/mirror-maze', category: 'puzzle', difficulty: 'hard', avgPlayTime: 10, tags: ['puzzle', 'light', 'mirrors'] },
  { id: 'gear-works', name: 'Gear Works', description: 'Mechanical gear-fitting puzzles', path: '/games/gear-works', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'gears', 'mechanical'] },

  // Enhanced Memory Games (Cycle 32)
  { id: 'face-memory', name: 'Face Memory', description: 'Facial recognition and recall', path: '/games/face-memory', category: 'memory', difficulty: 'hard', avgPlayTime: 10, tags: ['memory', 'faces', 'recognition'] },
  { id: 'sequence-builder', name: 'Sequence Builder', description: 'Complex pattern memorization', path: '/games/sequence-builder', category: 'memory', difficulty: 'hard', avgPlayTime: 10, tags: ['memory', 'sequence', 'pattern'] },
  { id: 'location-memory', name: 'Location Memory', description: 'Spatial memory challenges', path: '/games/location-memory', category: 'memory', difficulty: 'medium', avgPlayTime: 10, tags: ['memory', 'spatial', 'location'] },

  // Enhanced Skill Games (Cycle 32)
  { id: 'precision-timing', name: 'Precision Timing', description: 'Multi-layered timing challenges', path: '/games/precision-timing', category: 'skill', difficulty: 'hard', avgPlayTime: 5, tags: ['skill', 'timing', 'precision'] },
  { id: 'finger-dance', name: 'Finger Dance', description: 'Multi-touch coordination game', path: '/games/finger-dance', category: 'skill', difficulty: 'hard', avgPlayTime: 5, tags: ['skill', 'coordination', 'touch'] },

  // Cycle 33: New Games (20 total)
  // Competitive Online Games
  { id: 'online-chess', name: 'Online Chess', description: 'Chess with ELO rating system', path: '/games/online-chess', category: 'strategy', difficulty: 'hard', avgPlayTime: 30, tags: ['strategy', 'online', 'chess', 'elo', 'competitive'] },
  { id: 'online-checkers', name: 'Online Checkers', description: 'Checkers with matchmaking', path: '/games/online-checkers', category: 'strategy', difficulty: 'medium', avgPlayTime: 15, tags: ['strategy', 'online', 'checkers', 'matchmaking'] },
  { id: 'online-pool', name: 'Online Pool', description: 'Pool with real-time physics', path: '/games/online-pool', category: 'skill', difficulty: 'medium', avgPlayTime: 15, tags: ['skill', 'online', 'pool', 'billiards', 'physics'] },
  { id: 'online-reversi', name: 'Online Reversi', description: 'Reversi with strategy ranking', path: '/games/online-reversi', category: 'strategy', difficulty: 'medium', avgPlayTime: 15, tags: ['strategy', 'online', 'reversi', 'othello', 'ranking'] },
  { id: 'online-backgammon', name: 'Online Backgammon', description: 'Tournament-ready backgammon', path: '/games/online-backgammon', category: 'strategy', difficulty: 'hard', avgPlayTime: 20, tags: ['strategy', 'online', 'backgammon', 'tournament'] },
  
  // Puzzle Expansion Games
  { id: 'hexagon-puzzle', name: 'Hexagon Puzzle', description: 'Hexagonal piece fitting puzzle', path: '/games/hexagon-puzzle', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'hexagon', 'shapes', 'tetris-like'] },
  { id: 'word-ladder', name: 'Word Ladder', description: 'Transform words step by step', path: '/games/word-ladder', category: 'word', difficulty: 'medium', avgPlayTime: 10, tags: ['word', 'puzzle', 'vocabulary', 'ladder'] },
  { id: 'logic-master', name: 'Logic Master', description: 'Advanced logic puzzles', path: '/games/logic-master', category: 'puzzle', difficulty: 'hard', avgPlayTime: 15, tags: ['puzzle', 'logic', 'deduction', 'brain'] },
  { id: 'number-chain', name: 'Number Chain', description: 'Create chains to reach targets', path: '/games/number-chain', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'numbers', 'math', 'chain'] },
  { id: 'pattern-quest', name: 'Pattern Quest', description: 'Match and create patterns', path: '/games/pattern-quest', category: 'puzzle', difficulty: 'medium', avgPlayTime: 10, tags: ['puzzle', 'pattern', 'matching', 'visual'] },
  
  // New Action Games
  { id: 'ninja-warrior', name: 'Ninja Warrior', description: 'Jump and dodge as a ninja', path: '/games/ninja-warrior', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['action', 'ninja', 'platformer', 'jumping'] },
  { id: 'speed-runner', name: 'Speed Runner', description: 'High-speed platforming', path: '/games/speed-runner', category: 'action', difficulty: 'hard', avgPlayTime: 5, tags: ['action', 'speed', 'runner', 'platformer'] },
  { id: 'laser-defense', name: 'Laser Defense', description: 'Defend against laser attacks', path: '/games/laser-defense', category: 'action', difficulty: 'medium', avgPlayTime: 10, tags: ['action', 'defense', 'laser', 'shield'] },
  { id: 'galaxy-explorer', name: 'Galaxy Explorer', description: 'Explore and discover planets', path: '/games/galaxy-explorer', category: 'action', difficulty: 'easy', avgPlayTime: 10, tags: ['action', 'space', 'exploration', 'adventure'] },
  { id: 'time-attack', name: 'Time Attack', description: 'Hit targets before time runs out', path: '/games/time-attack', category: 'action', difficulty: 'medium', avgPlayTime: 5, tags: ['action', 'time', 'targets', 'reflex'] },
  
  // Casual Games
  { id: 'cookie-clicker', name: 'Cookie Clicker Evolution', description: 'Click cookies and build empire', path: '/games/cookie-clicker', category: 'arcade', difficulty: 'easy', avgPlayTime: 15, tags: ['casual', 'clicker', 'idle', 'cookies'] },
  { id: 'zen-garden', name: 'Zen Garden', description: 'Grow a peaceful garden', path: '/games/zen-garden', category: 'simulation', difficulty: 'easy', avgPlayTime: 10, tags: ['casual', 'garden', 'relaxing', 'zen'] },
  { id: 'fish-tank', name: 'Fish Tank Manager', description: 'Manage virtual aquarium', path: '/games/fish-tank', category: 'simulation', difficulty: 'easy', avgPlayTime: 10, tags: ['casual', 'fish', 'aquarium', 'pet'] },
  { id: 'bubble-wrap', name: 'Bubble Wrap Pop', description: 'Pop virtual bubble wrap', path: '/games/bubble-wrap', category: 'arcade', difficulty: 'easy', avgPlayTime: 5, tags: ['casual', 'bubble', 'popping', 'satisfying'] },
  { id: 'fortune-wheel', name: 'Fortune Wheel', description: 'Spin the wheel of fortune', path: '/games/fortune-wheel', category: 'casino', difficulty: 'easy', avgPlayTime: 5, tags: ['casual', 'wheel', 'fortune', 'luck'] },
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

// Enhanced helper functions for multi-category support
export function getGamesByCategoriesWithLogic(
  categories: GameCategory[],
  logic: 'AND' | 'OR' = 'OR',
  minRelevance: number = 0
): GameCategoryMapping[] {
  if (categories.length === 0) return gameCategories

  return gameCategories.filter(game => {
    // Check primary category
    const primaryMatch = categories.includes(game.category)
    
    // Check multi-categories if available
    const multiCategoryMatches = game.categories?.filter(cat => 
      categories.includes(cat.category) && cat.relevance >= minRelevance
    ) || []
    
    if (logic === 'OR') {
      return primaryMatch || multiCategoryMatches.length > 0
    } else {
      // AND logic - game must match all specified categories
      return categories.every(cat => 
        cat === game.category || 
        game.categories?.some(gc => gc.category === cat && gc.relevance >= minRelevance)
      )
    }
  })
}

// Get games filtered by multiple criteria
export interface GameFilterCriteria {
  categories?: GameCategory[]
  categoryLogic?: 'AND' | 'OR'
  difficulty?: GameDifficulty[]
  minRating?: number
  maxPlayTime?: number
  tags?: string[]
  sortBy?: 'name' | 'rating' | 'playCount' | 'difficulty' | 'newest'
  sortOrder?: 'asc' | 'desc'
}

export function filterGames(criteria: GameFilterCriteria): GameCategoryMapping[] {
  let filtered = [...gameCategories]
  
  // Filter by categories
  if (criteria.categories && criteria.categories.length > 0) {
    filtered = getGamesByCategoriesWithLogic(
      criteria.categories,
      criteria.categoryLogic || 'OR'
    )
  }
  
  // Filter by difficulty
  if (criteria.difficulty && criteria.difficulty.length > 0) {
    filtered = filtered.filter(game => criteria.difficulty!.includes(game.difficulty))
  }
  
  // Filter by rating
  if (criteria.minRating) {
    filtered = filtered.filter(game => (game.rating || 0) >= criteria.minRating!)
  }
  
  // Filter by play time
  if (criteria.maxPlayTime) {
    filtered = filtered.filter(game => game.avgPlayTime <= criteria.maxPlayTime!)
  }
  
  // Filter by tags
  if (criteria.tags && criteria.tags.length > 0) {
    filtered = filtered.filter(game => 
      criteria.tags!.some(tag => game.tags.includes(tag))
    )
  }
  
  // Sort results
  if (criteria.sortBy) {
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (criteria.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0)
          break
        case 'playCount':
          comparison = (b.playCount || 0) - (a.playCount || 0)
          break
        case 'difficulty':
          const diffOrder = { 'easy': 1, 'medium': 2, 'hard': 3 }
          comparison = diffOrder[a.difficulty] - diffOrder[b.difficulty]
          break
        case 'newest':
          comparison = (b.lastUpdated?.getTime() || 0) - (a.lastUpdated?.getTime() || 0)
          break
      }
      
      return criteria.sortOrder === 'desc' ? -comparison : comparison
    })
  }
  
  return filtered
}

// Get category statistics
export interface CategoryStats {
  category: GameCategory
  gameCount: number
  avgRating: number
  totalPlayCount: number
  avgPlayTime: number
  popularTags: string[]
}

export function getCategoryStats(): CategoryStats[] {
  const categories = getAllCategories() as GameCategory[]
  
  return categories.map(category => {
    const games = getGamesByCategory(category)
    const totalRating = games.reduce((sum, game) => sum + (game.rating || 0), 0)
    const totalPlayCount = games.reduce((sum, game) => sum + (game.playCount || 0), 0)
    const totalPlayTime = games.reduce((sum, game) => sum + game.avgPlayTime, 0)
    
    // Get all tags and count frequency
    const tagCounts = new Map<string, number>()
    games.forEach(game => {
      game.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    
    // Get top 5 most popular tags
    const popularTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)
    
    return {
      category,
      gameCount: games.length,
      avgRating: games.length > 0 ? totalRating / games.length : 0,
      totalPlayCount,
      avgPlayTime: games.length > 0 ? totalPlayTime / games.length : 0,
      popularTags
    }
  })
}