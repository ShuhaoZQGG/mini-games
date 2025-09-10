'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search, Gamepad2, Sparkles, Brain, Target, Users, Trophy } from 'lucide-react'
import { EnhancedGameSearch, Game } from '@/components/EnhancedGameSearch'
import { CategoryGrid } from '@/src/components/CategoryGrid'
import { Category } from '@/src/types/category'
import { RecommendedGames, TrendingGames, RecentlyPlayed, DailyChallenges } from '@/components/RecommendedGames'
import { analytics } from '@/lib/analytics'

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'categories' | 'all'>('categories')
  
  const singlePlayerGames = [
    // Action/Reflex Games
    { id: 'cps-test', name: 'CPS Test', description: 'Test your clicking speed', path: '/games/cps-test' },
    { id: 'reaction-time', name: 'Reaction Time', description: 'Test your reflexes', path: '/games/reaction-time' },
    { id: 'aim-trainer', name: 'Aim Trainer', description: 'Test your accuracy', path: '/games/aim-trainer' },
    { id: 'whack-a-mole', name: 'Whack-a-Mole', description: 'Test your reflexes', path: '/games/whack-a-mole' },
    { id: 'fruit-ninja', name: 'Fruit Ninja', description: 'Swipe to slice fruits', path: '/games/fruit-ninja' },
    { id: 'temple-run', name: 'Temple Run', description: 'Endless runner with obstacles', path: '/games/temple-run' },
    { id: 'angry-birds', name: 'Angry Birds', description: 'Physics-based projectile game', path: '/games/angry-birds' },
    { id: 'geometry-dash', name: 'Geometry Dash', description: 'Rhythm-based platformer', path: '/games/geometry-dash' },
    { id: 'tank-battle', name: 'Tank Battle', description: 'Top-down shooter', path: '/games/tank-battle' },
    
    // Memory Games
    { id: 'memory-match', name: 'Memory Match', description: 'Match the cards', path: '/games/memory-match' },
    { id: 'simon-says', name: 'Simon Says', description: 'Memory pattern game', path: '/games/simon-says' },
    { id: 'pattern-memory', name: 'Pattern Memory', description: 'Test your memory skills', path: '/games/pattern-memory' },
    
    // Puzzle Games
    { id: '2048', name: '2048', description: 'Slide tiles to reach 2048', path: '/games/2048' },
    { id: 'sudoku', name: 'Sudoku', description: 'Number puzzle game', path: '/games/sudoku' },
    { id: 'minesweeper', name: 'Minesweeper', description: 'Find all the mines', path: '/games/minesweeper' },
    { id: 'sliding-puzzle', name: 'Sliding Puzzle', description: 'Classic 15-puzzle game', path: '/games/sliding-puzzle' },
    { id: 'jigsaw-puzzle', name: 'Jigsaw Puzzle', description: 'Piece together puzzles', path: '/games/jigsaw-puzzle' },
    { id: 'nonogram', name: 'Nonogram', description: 'Picture logic puzzles', path: '/games/nonogram' },
    { id: 'number-guessing', name: 'Number Guessing', description: 'Guess the secret number', path: '/games/number-guessing' },
    { id: 'maze-runner', name: 'Maze Runner', description: 'Navigate through the maze', path: '/games/maze-runner' },
    { id: 'tower-of-hanoi', name: 'Tower of Hanoi', description: 'Classic disk puzzle', path: '/games/tower-of-hanoi' },
    { id: 'lights-out', name: 'Lights Out', description: 'Turn off all the lights', path: '/games/lights-out' },
    { id: 'mastermind', name: 'Mastermind', description: 'Break the color code', path: '/games/mastermind' },
    { id: 'flow-free', name: 'Flow Free', description: 'Connect matching colors without crossing paths', path: '/games/flow-free' },
    { id: 'tangram', name: 'Tangram', description: 'Shape arrangement puzzle', path: '/games/tangram' },
    { id: 'pipes', name: 'Pipes', description: 'Connect pipes to create flow', path: '/games/pipes' },
    { id: 'hexagon', name: 'Hexagon', description: 'Fit hexagonal pieces together', path: '/games/hexagon' },
    { id: 'mahjong-solitaire', name: 'Mahjong Solitaire', description: 'Classic tile matching with multiple layouts', path: '/games/mahjong-solitaire' },
    
    // Word Games
    { id: 'typing-test', name: 'Typing Test', description: 'Test your typing speed', path: '/games/typing-test' },
    { id: 'word-search', name: 'Word Search', description: 'Find hidden words', path: '/games/word-search' },
    { id: 'crossword', name: 'Crossword', description: 'Word puzzle challenges', path: '/games/crossword' },
    { id: 'wordle', name: 'Wordle', description: 'Guess the 5-letter word', path: '/games/wordle' },
    { id: 'hangman', name: 'Hangman', description: 'Guess the word letter by letter', path: '/games/hangman' },
    { id: 'boggle', name: 'Boggle', description: 'Word finding in letter grid', path: '/games/boggle' },
    { id: 'scrabble', name: 'Scrabble', description: 'Word building with letter values', path: '/games/scrabble' },
    
    // Strategy Games
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Classic X and O game', path: '/games/tic-tac-toe' },
    { id: 'connect-four', name: 'Connect Four', description: 'Get four in a row', path: '/games/connect-four' },
    { id: 'chess', name: 'Chess', description: 'Ultimate strategy game', path: '/games/chess' },
    { id: 'checkers', name: 'Checkers', description: 'Classic board game', path: '/games/checkers' },
    { id: 'reversi', name: 'Reversi/Othello', description: 'Flip discs to win', path: '/games/reversi' },
    { id: 'backgammon', name: 'Backgammon', description: 'Ancient dice and strategy', path: '/games/backgammon' },
    { id: 'dominoes', name: 'Dominoes', description: 'Traditional tile game', path: '/games/dominoes' },
    { id: 'risk', name: 'Risk', description: 'Territory conquest strategy', path: '/games/risk' },
    { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', description: 'Classic hand game', path: '/games/rock-paper-scissors' },
    
    // Arcade Games  
    { id: 'snake', name: 'Snake', description: 'Classic snake game', path: '/games/snake' },
    { id: 'tetris', name: 'Tetris', description: 'Stack falling blocks', path: '/games/tetris' },
    { id: 'breakout', name: 'Breakout', description: 'Break all the bricks', path: '/games/breakout' },
    { id: 'pacman', name: 'Pac-Man', description: 'Classic arcade maze game', path: '/games/pacman' },
    { id: 'space-invaders', name: 'Space Invaders', description: 'Defend Earth from aliens', path: '/games/space-invaders' },
    { id: 'flappy-bird', name: 'Flappy Bird', description: 'Navigate through pipes', path: '/games/flappy-bird' },
    { id: 'doodle-jump', name: 'Doodle Jump', description: 'Jump to new heights', path: '/games/doodle-jump' },
    { id: 'pinball', name: 'Pinball', description: 'Classic arcade pinball', path: '/games/pinball' },
    { id: 'bubble-shooter', name: 'Bubble Shooter', description: 'Match and pop bubbles', path: '/games/bubble-shooter' },
    
    // Skill Games
    { id: 'mental-math', name: 'Mental Math', description: 'Solve math problems', path: '/games/mental-math' },
    { id: 'color-switch', name: 'Color Switch', description: 'Match colors to survive', path: '/games/color-switch' },
    { id: 'stack-tower', name: 'Stack Tower', description: 'Build the tallest tower', path: '/games/stack-tower' },
    
    // Card/Casino Games
    { id: 'solitaire', name: 'Solitaire', description: 'Classic card game', path: '/games/solitaire' },
    { id: 'blackjack', name: 'Blackjack', description: 'Casino card game', path: '/games/blackjack' },
    { id: 'video-poker', name: 'Video Poker', description: 'Jacks or Better poker', path: '/games/video-poker' },
    { id: 'go-fish', name: 'Go Fish', description: 'Classic card matching', path: '/games/go-fish' },
    { id: 'war', name: 'War', description: 'Simple card battle', path: '/games/war' },
    { id: 'crazy-eights', name: 'Crazy Eights', description: 'Wild card game', path: '/games/crazy-eights' },
    { id: 'hearts', name: 'Hearts', description: 'Trick-taking card game', path: '/games/hearts' },
    { id: 'spades', name: 'Spades', description: 'Partnership card game', path: '/games/spades' },
    
    // Casino Games
    { id: 'roulette', name: 'Roulette', description: 'Spin the wheel of fortune', path: '/games/roulette' },
    { id: 'bingo', name: 'Bingo', description: 'Classic number matching game', path: '/games/bingo' },
    { id: 'dice-roll', name: 'Dice Roll', description: 'Roll dice to hit the target', path: '/games/dice-roll' },
    { id: 'coin-flip', name: 'Coin Flip', description: 'Heads or tails betting', path: '/games/coin-flip' },
    { id: 'yahtzee', name: 'Yahtzee', description: 'Dice game with scoring combinations', path: '/games/yahtzee' },
  ]
  
  // Game categories
  const categories: Category[] = [
    {
      id: 'puzzle',
      name: 'Puzzle',
      slug: 'puzzle',
      description: 'Brain teasers and logic games',
      icon: '🧩',
      color: '#8B5CF6',
      featured: true
    },
    {
      id: 'action',
      name: 'Action',
      slug: 'action',
      description: 'Fast-paced reflex games',
      icon: '⚡',
      color: '#EF4444',
      featured: true
    },
    {
      id: 'strategy',
      name: 'Strategy',
      slug: 'strategy',
      description: 'Plan and think ahead',
      icon: '♟️',
      color: '#3B82F6',
      featured: true
    },
    {
      id: 'arcade',
      name: 'Arcade',
      slug: 'arcade',
      description: 'Classic arcade games',
      icon: '👾',
      color: '#10B981',
      featured: false
    },
    {
      id: 'card',
      name: 'Card Games',
      slug: 'card',
      description: 'Traditional card games',
      icon: '🃏',
      color: '#F59E0B',
      featured: false
    },
    {
      id: 'word',
      name: 'Word',
      slug: 'word',
      description: 'Vocabulary and language',
      icon: '📝',
      color: '#EC4899',
      featured: false
    },
    {
      id: 'casual',
      name: 'Casual',
      slug: 'casual',
      description: 'Relaxing easy games',
      icon: '🎮',
      color: '#14B8A6',
      featured: false
    },
    {
      id: 'skill',
      name: 'Skill',
      slug: 'skill',
      description: 'Test your abilities',
      icon: '🎯',
      color: '#F97316',
      featured: false
    },
    {
      id: 'multiplayer',
      name: 'Multiplayer',
      slug: 'multiplayer',
      description: 'Play with friends',
      icon: '👥',
      color: '#6366F1',
      featured: true
    }
  ];

  const multiplayerGames = [
    { id: 'dots-and-boxes', name: 'Dots and Boxes', description: 'Connect dots to win', path: '/games/dots-and-boxes' },
    { id: 'pool', name: '8-Ball Pool', description: 'Classic billiards game', path: '/games/pool' },
    { id: 'battleship', name: 'Battleship', description: 'Naval strategy game', path: '/games/battleship' },
    { id: 'air-hockey', name: 'Air Hockey', description: 'Fast-paced table game', path: '/games/air-hockey' },
  ]

  // Combine all games for search with metadata
  const allGames: Game[] = [
    ...singlePlayerGames.map(g => ({ 
      ...g, 
      category: 'Single Player',
      playerCount: '1',
      tags: ['casual', 'single-player']
    })),
    ...multiplayerGames.map(g => ({ 
      ...g, 
      category: 'Multiplayer',
      playerCount: '2+',
      tags: ['competitive', 'multiplayer', 'pvp']
    }))
  ]

  // Keyboard shortcut for search and analytics
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    // Track page view
    analytics.trackPageView('homepage')
    
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div>
      {/* Enhanced Search Overlay */}
      <EnhancedGameSearch 
        games={allGames}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <section className="bg-gradient-to-b from-primary to-indigo-700 text-white py-16">
        <div className="container-responsive text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Play Free Mini Games</h1>
          <p className="text-xl mb-6">No registration required. Start playing instantly!</p>
          
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
            <span>Search Games</span>
            <kbd className="ml-2 px-2 py-1 text-xs bg-white/20 rounded">⌘K</kbd>
          </button>
        </div>
      </section>

      <div className="container-responsive py-12">
        {/* Recently Played Section */}
        <div className="mb-8">
          <RecentlyPlayed />
        </div>

        {/* Recommendations and Trending Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <RecommendedGames />
          </div>
          <div className="space-y-6">
            <TrendingGames />
            <DailyChallenges />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('categories')}
              className={`px-4 py-2 rounded-l-lg transition-colors ${
                viewMode === 'categories' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Browse by Category
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-r-lg transition-colors ${
                viewMode === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              View All Games
            </button>
          </div>
        </div>

        {/* Category View */}
        {viewMode === 'categories' ? (
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-center">Browse Games by Category</h2>
            <CategoryGrid categories={categories} />
            
            {/* Featured Games */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4">🔥 Popular Games</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...singlePlayerGames.slice(0, 4)].map((game) => (
                  <Link key={game.id} href={game.path}>
                    <div className="game-card cursor-pointer hover:scale-105 transition-transform">
                      <h4 className="text-lg font-semibold mb-2">{game.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{game.description}</p>
                      <button className="mt-3 btn-primary text-sm">Play Now</button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}