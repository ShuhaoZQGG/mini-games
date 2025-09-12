'use client'

import React, { useState, useCallback, useEffect } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RefreshCw, Trophy, Clock, CheckCircle } from 'lucide-react'

interface WordPosition {
  word: string
  start: [number, number]
  end: [number, number]
  direction: string
}

interface WordSearchGameProps {
  levelConfig: {
    gridSize: number
    wordCount: number
    minWordLength: number
    maxWordLength: number
    allowDiagonal: boolean
    allowBackward: boolean
    timeLimit: number // in seconds, 0 for unlimited
    targetScore: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Grid',
    difficulty: 'easy',
    config: {
      gridSize: 10,
      wordCount: 6,
      minWordLength: 3,
      maxWordLength: 6,
      allowDiagonal: false,
      allowBackward: false,
      timeLimit: 0,
      targetScore: 600
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Standard Search',
    difficulty: 'medium',
    config: {
      gridSize: 12,
      wordCount: 8,
      minWordLength: 4,
      maxWordLength: 8,
      allowDiagonal: true,
      allowBackward: false,
      timeLimit: 300,
      targetScore: 1200
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Complex Grid',
    difficulty: 'hard',
    config: {
      gridSize: 14,
      wordCount: 10,
      minWordLength: 4,
      maxWordLength: 10,
      allowDiagonal: true,
      allowBackward: true,
      timeLimit: 240,
      targetScore: 2000
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Puzzle',
    difficulty: 'expert',
    config: {
      gridSize: 16,
      wordCount: 12,
      minWordLength: 5,
      maxWordLength: 12,
      allowDiagonal: true,
      allowBackward: true,
      timeLimit: 180,
      targetScore: 3000
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master Challenge',
    difficulty: 'master',
    config: {
      gridSize: 18,
      wordCount: 15,
      minWordLength: 5,
      maxWordLength: 14,
      allowDiagonal: true,
      allowBackward: true,
      timeLimit: 150,
      targetScore: 4500
    },
    requiredStars: 12
  }
]

class WordSearchGame {
  public grid: string[][]
  public words: string[]
  public foundWords: Set<string>
  public wordPositions: Map<string, WordPosition>
  public selectedCells: [number, number][]
  public highlightedCells: Map<string, string>
  public score: number
  public startTime: number
  public duration: number
  private gridSize: number
  private levelConfig: any
  private wordList: string[] = [
    'REACT', 'NEXT', 'TYPESCRIPT', 'JAVASCRIPT', 
    'HTML', 'CSS', 'NODE', 'API', 'CODE', 'WEB',
    'GAME', 'PLAY', 'FUN', 'SCORE', 'WIN',
    'PUZZLE', 'SEARCH', 'FIND', 'GRID', 'WORD',
    'CHALLENGE', 'MASTER', 'EXPERT', 'LEVEL', 'STAR',
    'VICTORY', 'COMPLETE', 'SUCCESS', 'ACHIEVE', 'GOAL'
  ]

  constructor(config: any) {
    this.levelConfig = config
    this.gridSize = config.gridSize
    this.grid = []
    this.words = []
    this.foundWords = new Set()
    this.wordPositions = new Map()
    this.selectedCells = []
    this.highlightedCells = new Map()
    this.score = 0
    this.startTime = 0
    this.duration = 0
    this.initializeGame()
  }

  private initializeGame(): void {
    this.grid = this.createEmptyGrid()
    this.words = this.selectRandomWords(this.levelConfig.wordCount)
    this.placeWords()
    this.fillEmptySpaces()
  }

  private createEmptyGrid(): string[][] {
    return Array(this.gridSize).fill(null).map(() => 
      Array(this.gridSize).fill('')
    )
  }

  private selectRandomWords(count: number): string[] {
    const filtered = this.wordList.filter(word => 
      word.length >= this.levelConfig.minWordLength && 
      word.length <= this.levelConfig.maxWordLength
    )
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  private placeWords(): void {
    const directions: number[][] = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
    ]
    
    if (this.levelConfig.allowDiagonal) {
      directions.push(
        [1, 1],   // Diagonal down-right
        [-1, 1],  // Diagonal up-right
      )
    }
    
    if (this.levelConfig.allowBackward) {
      const currentDirs = [...directions]
      currentDirs.forEach(([dr, dc]) => {
        directions.push([-dr, -dc])
      })
    }

    for (const word of this.words) {
      let placed = false
      let attempts = 0
      
      while (!placed && attempts < 100) {
        const direction = directions[Math.floor(Math.random() * directions.length)]
        const startRow = Math.floor(Math.random() * this.gridSize)
        const startCol = Math.floor(Math.random() * this.gridSize)
        
        if (this.canPlaceWord(word, startRow, startCol, direction)) {
          this.placeWord(word, startRow, startCol, direction)
          placed = true
        }
        attempts++
      }
    }
  }

  private canPlaceWord(word: string, row: number, col: number, direction: number[]): boolean {
    const [dr, dc] = direction
    
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dr
      const newCol = col + i * dc
      
      if (newRow < 0 || newRow >= this.gridSize || 
          newCol < 0 || newCol >= this.gridSize) {
        return false
      }
      
      if (this.grid[newRow][newCol] !== '' && 
          this.grid[newRow][newCol] !== word[i]) {
        return false
      }
    }
    
    return true
  }

  private placeWord(word: string, row: number, col: number, direction: number[]): void {
    const [dr, dc] = direction
    const endRow = row + (word.length - 1) * dr
    const endCol = col + (word.length - 1) * dc
    
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dr
      const newCol = col + i * dc
      this.grid[newRow][newCol] = word[i]
    }
    
    this.wordPositions.set(word, {
      word,
      start: [row, col],
      end: [endRow, endCol],
      direction: `${dr},${dc}`
    })
  }

  private fillEmptySpaces(): void {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === '') {
          this.grid[i][j] = letters[Math.floor(Math.random() * letters.length)]
        }
      }
    }
  }

  start(): void {
    this.startTime = Date.now()
    this.foundWords.clear()
    this.selectedCells = []
    this.highlightedCells.clear()
  }

  selectCell(row: number, col: number): void {
    const cellKey = `${row},${col}`
    const existingIndex = this.selectedCells.findIndex(
      ([r, c]) => r === row && c === col
    )
    
    if (existingIndex !== -1) {
      this.selectedCells.splice(existingIndex, 1)
    } else {
      this.selectedCells.push([row, col])
    }
  }

  checkSelection(): string | null {
    if (this.selectedCells.length < 2) return null
    
    const selectedWord = this.getSelectedWord()
    
    for (const word of this.words) {
      if (this.foundWords.has(word)) continue
      
      if (word === selectedWord || word === selectedWord.split('').reverse().join('')) {
        this.foundWords.add(word)
        this.markWordAsFound(word)
        this.selectedCells = []
        
        if (this.foundWords.size === this.words.length) {
          this.duration = Date.now() - this.startTime
          this.score = this.calculateScore()
        }
        
        return word
      }
    }
    
    return null
  }

  private getSelectedWord(): string {
    return this.selectedCells
      .map(([r, c]) => this.grid[r][c])
      .join('')
  }

  private markWordAsFound(word: string): void {
    const position = this.wordPositions.get(word)
    if (!position) return
    
    const [dr, dc] = position.direction.split(',').map(Number)
    const [startRow, startCol] = position.start
    
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * dr
      const col = startCol + i * dc
      this.highlightedCells.set(`${row},${col}`, word)
    }
  }

  public calculateScore(): number {
    let baseScore = this.foundWords.size * 100
    
    // Time bonus
    if (this.levelConfig.timeLimit > 0) {
      const timeRemaining = Math.max(0, this.levelConfig.timeLimit - Math.floor(this.duration / 1000))
      baseScore += timeRemaining * 10
    } else {
      const timeTaken = Math.floor(this.duration / 1000)
      const timeBonus = Math.max(0, 300 - timeTaken)
      baseScore += timeBonus * 5
    }
    
    // Difficulty bonus
    const difficultyMultiplier = 1 + (this.levelConfig.gridSize - 10) * 0.1
    baseScore = Math.floor(baseScore * difficultyMultiplier)
    
    return baseScore
  }

  clearSelection(): void {
    this.selectedCells = []
  }

  reset(): void {
    this.initializeGame()
    this.start()
  }
}

function WordSearchCore({ levelConfig, onScore }: WordSearchGameProps) {
  const [game] = useState(() => new WordSearchGame(levelConfig))
  const [grid, setGrid] = useState(game.grid)
  const [words, setWords] = useState(game.words)
  const [foundWords, setFoundWords] = useState(new Set<string>())
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([])
  const [highlightedCells, setHighlightedCells] = useState(new Map<string, string>())
  const [gameStarted, setGameStarted] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSelecting, setIsSelecting] = useState(false)

  const updateGameState = useCallback(() => {
    setGrid([...game.grid])
    setWords([...game.words])
    setFoundWords(new Set(game.foundWords))
    setSelectedCells([...game.selectedCells])
    setHighlightedCells(new Map(game.highlightedCells))
    const won = game.foundWords.size === game.words.length
    setGameWon(won)
    if (won) {
      onScore(game.score)
    }
  }, [game, onScore])

  useEffect(() => {
    if (gameStarted && !gameWon) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - game.startTime) / 1000)
        setElapsedTime(elapsed)
        
        // Check time limit
        if (levelConfig.timeLimit > 0 && elapsed >= levelConfig.timeLimit) {
          setGameWon(true)
          game.duration = Date.now() - game.startTime
          game.score = game.calculateScore()
          onScore(game.score)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameStarted, gameWon, game, levelConfig.timeLimit, onScore])

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameStarted || gameWon) return
    
    game.selectCell(row, col)
    const foundWord = game.checkSelection()
    
    if (foundWord) {
      updateGameState()
    } else {
      setSelectedCells([...game.selectedCells])
    }
  }, [game, gameStarted, gameWon, updateGameState])

  const handleMouseDown = useCallback((row: number, col: number) => {
    if (!gameStarted || gameWon) return
    setIsSelecting(true)
    game.clearSelection()
    game.selectCell(row, col)
    setSelectedCells([...game.selectedCells])
  }, [game, gameStarted, gameWon])

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (!isSelecting || !gameStarted || gameWon) return
    game.selectCell(row, col)
    setSelectedCells([...game.selectedCells])
  }, [game, isSelecting, gameStarted, gameWon])

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return
    setIsSelecting(false)
    
    const foundWord = game.checkSelection()
    if (foundWord) {
      updateGameState()
    } else {
      setTimeout(() => {
        game.clearSelection()
        setSelectedCells([])
      }, 500)
    }
  }, [game, isSelecting, updateGameState])

  const handleStart = useCallback(() => {
    game.start()
    setGameStarted(true)
    setGameWon(false)
    setElapsedTime(0)
    updateGameState()
  }, [game, updateGameState])

  const handleReset = useCallback(() => {
    game.reset()
    setGameStarted(false)
    setGameWon(false)
    setElapsedTime(0)
    updateGameState()
  }, [game, updateGameState])

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(([r, c]) => r === row && c === col)
  }

  const isCellHighlighted = (row: number, col: number) => {
    return highlightedCells.has(`${row},${col}`)
  }

  const getCellColor = (row: number, col: number) => {
    if (isCellSelected(row, col)) return 'bg-blue-500 text-white'
    if (isCellHighlighted(row, col)) return 'bg-green-500 text-white'
    return 'bg-gray-100 hover:bg-gray-200'
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRemainingTime = (): number => {
    if (levelConfig.timeLimit === 0) return -1
    return Math.max(0, levelConfig.timeLimit - elapsedTime)
  }

  const cellSize = Math.max(24, Math.floor(480 / levelConfig.gridSize))

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex gap-8 flex-col lg:flex-row">
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg">
                  {levelConfig.timeLimit > 0 ? (
                    <span className={getRemainingTime() < 30 ? 'text-red-500' : ''}>
                      {formatTime(getRemainingTime())}
                    </span>
                  ) : (
                    formatTime(elapsedTime)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold">
                  {foundWords.size} / {words.length}
                </span>
              </div>
            </div>

            <div 
              className={`grid gap-1 select-none`}
              style={{
                gridTemplateColumns: `repeat(${levelConfig.gridSize}, 1fr)`,
                width: 'fit-content'
              }}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      text-sm font-bold rounded
                      ${getCellColor(rowIndex, colIndex)}
                      transition-colors cursor-pointer
                      ${!gameStarted || gameWon ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`
                    }}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={!gameStarted || gameWon}
                  >
                    {cell}
                  </button>
                ))
              )}
            </div>

            {gameWon && (
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-semibold text-green-800">
                  {foundWords.size === words.length ? 'Congratulations! You found all words!' : 'Time\'s up!'}
                </p>
                <p className="text-sm text-green-600">
                  Words Found: {foundWords.size}/{words.length} | Score: {game.score}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {!gameStarted ? (
                <Button onClick={handleStart} className="gap-2">
                  Start Game
                </Button>
              ) : (
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  New Game
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Words to Find:</h3>
          <div className="grid grid-cols-2 gap-2">
            {words.map((word) => (
              <div
                key={word}
                className={`
                  px-3 py-1 rounded text-sm font-mono
                  ${foundWords.has(word) 
                    ? 'bg-green-100 text-green-800 line-through' 
                    : 'bg-gray-100 text-gray-800'}
                `}
              >
                {word}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function WordSearchWithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 100) return 3
    if (percentage >= 70) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="word-search"
      gameName="Word Search"
      levels={levels}
      renderGame={(config, onScore) => <WordSearchCore levelConfig={config} onScore={onScore} />}
      getStars={getStars}
    />
  )
}