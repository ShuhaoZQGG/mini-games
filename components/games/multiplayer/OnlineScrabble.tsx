'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users, Check, X } from 'lucide-react'

interface Tile {
  letter: string
  value: number
}

interface BoardCell {
  tile: Tile | null
  multiplier: 'DL' | 'TL' | 'DW' | 'TW' | null
  locked: boolean
}

interface Player {
  id: number
  name: string
  score: number
  tiles: Tile[]
  isAI: boolean
}

interface PlacedTile {
  row: number
  col: number
  tile: Tile
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  board: BoardCell[][]
  players: Player[]
  currentPlayer: number
  tileBag: Tile[]
  placedTiles: PlacedTile[]
  consecutivePasses: number
  turnCount: number
  validWords: Set<string>
}

const BOARD_SIZE = 15
const TILE_DISTRIBUTION: { [key: string]: { count: number; value: number } } = {
  A: { count: 9, value: 1 }, B: { count: 2, value: 3 }, C: { count: 2, value: 3 },
  D: { count: 4, value: 2 }, E: { count: 12, value: 1 }, F: { count: 2, value: 4 },
  G: { count: 3, value: 2 }, H: { count: 2, value: 4 }, I: { count: 9, value: 1 },
  J: { count: 1, value: 8 }, K: { count: 1, value: 5 }, L: { count: 4, value: 1 },
  M: { count: 2, value: 3 }, N: { count: 6, value: 1 }, O: { count: 8, value: 1 },
  P: { count: 2, value: 3 }, Q: { count: 1, value: 10 }, R: { count: 6, value: 1 },
  S: { count: 4, value: 1 }, T: { count: 6, value: 1 }, U: { count: 4, value: 1 },
  V: { count: 2, value: 4 }, W: { count: 2, value: 4 }, X: { count: 1, value: 8 },
  Y: { count: 2, value: 4 }, Z: { count: 1, value: 10 }, _: { count: 2, value: 0 }
}

// Common words for validation (simplified dictionary)
const COMMON_WORDS = new Set([
  'THE', 'BE', 'TO', 'OF', 'AND', 'A', 'IN', 'THAT', 'HAVE', 'I',
  'IT', 'FOR', 'NOT', 'ON', 'WITH', 'HE', 'AS', 'YOU', 'DO', 'AT',
  'THIS', 'BUT', 'HIS', 'BY', 'FROM', 'THEY', 'WE', 'SAY', 'HER', 'SHE',
  'OR', 'AN', 'WILL', 'MY', 'ONE', 'ALL', 'WOULD', 'THERE', 'THEIR', 'WHAT',
  'SO', 'UP', 'OUT', 'IF', 'ABOUT', 'WHO', 'GET', 'WHICH', 'GO', 'ME',
  'CAT', 'DOG', 'RUN', 'JUMP', 'PLAY', 'GAME', 'WORD', 'TILE', 'SCORE', 'WIN',
  'BOARD', 'LETTER', 'POINT', 'TURN', 'MOVE', 'PLACE', 'SET', 'GET', 'PUT', 'TAKE',
  'RED', 'BLUE', 'GREEN', 'YELLOW', 'BLACK', 'WHITE', 'GRAY', 'PINK', 'BROWN', 'ORANGE',
  'BIG', 'SMALL', 'TALL', 'SHORT', 'LONG', 'WIDE', 'THIN', 'FAT', 'OLD', 'NEW',
  'HOT', 'COLD', 'WARM', 'COOL', 'FAST', 'SLOW', 'QUICK', 'LAZY', 'SMART', 'DUMB'
])

export default function OnlineScrabble() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    board: [],
    players: [],
    currentPlayer: 0,
    tileBag: [],
    placedTiles: [],
    consecutivePasses: 0,
    turnCount: 0,
    validWords: COMMON_WORDS
  })

  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)

  const initializeBoard = (): BoardCell[][] => {
    const board: BoardCell[][] = []
    for (let i = 0; i < BOARD_SIZE; i++) {
      board[i] = []
      for (let j = 0; j < BOARD_SIZE; j++) {
        let multiplier: 'DL' | 'TL' | 'DW' | 'TW' | null = null
        
        // Triple word scores
        if ((i === 0 || i === 7 || i === 14) && (j === 0 || j === 7 || j === 14)) {
          if (!(i === 7 && j === 7)) {
            multiplier = 'TW'
          }
        }
        // Double word scores
        else if ((i === j || i === 14 - j) && i !== 7) {
          multiplier = 'DW'
        }
        // Triple letter scores
        else if ((i === 5 || i === 9) && (j === 1 || j === 5 || j === 9 || j === 13)) {
          multiplier = 'TL'
        }
        else if ((i === 1 || i === 13) && (j === 5 || j === 9)) {
          multiplier = 'TL'
        }
        // Double letter scores
        else if ((i === 0 || i === 14) && (j === 3 || j === 11)) {
          multiplier = 'DL'
        }
        else if ((i === 3 || i === 11) && (j === 0 || j === 7 || j === 14)) {
          multiplier = 'DL'
        }
        else if ((i === 2 || i === 12) && (j === 6 || j === 8)) {
          multiplier = 'DL'
        }
        else if ((i === 6 || i === 8) && (j === 2 || j === 6 || j === 8 || j === 12)) {
          multiplier = 'DL'
        }
        
        board[i][j] = {
          tile: null,
          multiplier,
          locked: false
        }
      }
    }
    return board
  }

  const createTileBag = (): Tile[] => {
    const tiles: Tile[] = []
    for (const [letter, info] of Object.entries(TILE_DISTRIBUTION)) {
      for (let i = 0; i < info.count; i++) {
        tiles.push({ letter, value: info.value })
      }
    }
    return shuffleTiles(tiles)
  }

  const shuffleTiles = (tiles: Tile[]): Tile[] => {
    const shuffled = [...tiles]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const initializePlayers = (level: number): Player[] => {
    const numAI = Math.min(1 + Math.floor(level / 3), 3)
    const players: Player[] = [
      {
        id: 0,
        name: 'You',
        score: 0,
        tiles: [],
        isAI: false
      }
    ]

    for (let i = 1; i <= numAI; i++) {
      players.push({
        id: i,
        name: `AI ${i}`,
        score: 0,
        tiles: [],
        isAI: true
      })
    }

    return players
  }

  const drawTiles = (player: Player, tileBag: Tile[], count: number): { player: Player; tileBag: Tile[] } => {
    const newTileBag = [...tileBag]
    const newTiles: Tile[] = []
    
    for (let i = 0; i < count && newTileBag.length > 0; i++) {
      newTiles.push(newTileBag.pop()!)
    }
    
    return {
      player: { ...player, tiles: [...player.tiles, ...newTiles] },
      tileBag: newTileBag
    }
  }

  const getWordFromTiles = (tiles: PlacedTile[], isHorizontal: boolean): string => {
    const sorted = [...tiles].sort((a, b) => 
      isHorizontal ? a.col - b.col : a.row - b.row
    )
    return sorted.map(t => t.tile.letter).join('')
  }

  const validateWord = (word: string): boolean => {
    return gameState.validWords.has(word.toUpperCase())
  }

  const calculateScore = (placedTiles: PlacedTile[], board: BoardCell[][]): number => {
    let score = 0
    let wordMultiplier = 1
    
    for (const placed of placedTiles) {
      let tileScore = placed.tile.value
      const cell = board[placed.row][placed.col]
      
      if (!cell.locked) {
        if (cell.multiplier === 'DL') tileScore *= 2
        else if (cell.multiplier === 'TL') tileScore *= 3
        else if (cell.multiplier === 'DW') wordMultiplier *= 2
        else if (cell.multiplier === 'TW') wordMultiplier *= 3
      }
      
      score += tileScore
    }
    
    score *= wordMultiplier
    
    // Bonus for using all 7 tiles
    if (placedTiles.length === 7) {
      score += 50
    }
    
    return score
  }

  const placeTile = (row: number, col: number) => {
    if (gameState.gameStatus !== 'playing' || selectedTileIndex === null) return
    if (gameState.board[row][col].tile !== null) return

    setGameState(prev => {
      const player = prev.players[prev.currentPlayer]
      const tile = player.tiles[selectedTileIndex]
      
      const newPlacedTiles = [...prev.placedTiles, { row, col, tile }]
      
      return {
        ...prev,
        placedTiles: newPlacedTiles
      }
    })
    
    setSelectedTileIndex(null)
  }

  const removePlacedTile = (row: number, col: number) => {
    setGameState(prev => ({
      ...prev,
      placedTiles: prev.placedTiles.filter(p => !(p.row === row && p.col === col))
    }))
  }

  const submitWord = () => {
    if (gameState.placedTiles.length === 0) return

    // Check if tiles form a valid line
    const rows = new Set(gameState.placedTiles.map(t => t.row))
    const cols = new Set(gameState.placedTiles.map(t => t.col))
    
    const isHorizontal = rows.size === 1
    const isVertical = cols.size === 1
    
    if (!isHorizontal && !isVertical) {
      alert('Tiles must be placed in a straight line!')
      return
    }

    // Get the word
    const word = getWordFromTiles(gameState.placedTiles, isHorizontal)
    
    if (!validateWord(word)) {
      alert(`"${word}" is not a valid word!`)
      return
    }

    setGameState(prev => {
      const board = prev.board.map(row => row.map(cell => ({ ...cell })))
      const players = [...prev.players]
      const currentPlayer = players[prev.currentPlayer]
      
      // Place tiles on board and lock them
      for (const placed of prev.placedTiles) {
        board[placed.row][placed.col] = {
          ...board[placed.row][placed.col],
          tile: placed.tile,
          locked: true
        }
        
        // Remove tile from player's hand
        const tileIndex = currentPlayer.tiles.findIndex(t => 
          t.letter === placed.tile.letter && t.value === placed.tile.value
        )
        if (tileIndex !== -1) {
          currentPlayer.tiles.splice(tileIndex, 1)
        }
      }
      
      // Calculate score
      const turnScore = calculateScore(prev.placedTiles, board)
      currentPlayer.score += turnScore
      
      // Draw new tiles
      let tileBag = [...prev.tileBag]
      const tilesToDraw = Math.min(7 - currentPlayer.tiles.length, tileBag.length)
      const { player: updatedPlayer, tileBag: newTileBag } = drawTiles(currentPlayer, tileBag, tilesToDraw)
      players[prev.currentPlayer] = updatedPlayer
      tileBag = newTileBag
      
      // Check for victory
      if (currentPlayer.score >= 150 * prev.level) {
        return {
          ...prev,
          gameStatus: currentPlayer.isAI ? 'gameOver' : 'victory',
          board,
          players,
          score: currentPlayer.isAI ? prev.score : currentPlayer.score
        }
      }
      
      // Next player
      const nextPlayer = (prev.currentPlayer + 1) % players.length
      
      return {
        ...prev,
        board,
        players,
        tileBag,
        currentPlayer: nextPlayer,
        placedTiles: [],
        consecutivePasses: 0,
        turnCount: prev.turnCount + 1,
        score: currentPlayer.isAI ? prev.score : currentPlayer.score
      }
    })
  }

  const passTurn = () => {
    setGameState(prev => {
      const consecutivePasses = prev.consecutivePasses + 1
      
      // End game if all players pass
      if (consecutivePasses >= prev.players.length) {
        const winner = prev.players.reduce((max, p) => p.score > max.score ? p : max)
        return {
          ...prev,
          gameStatus: winner.isAI ? 'gameOver' : 'victory',
          consecutivePasses
        }
      }
      
      return {
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % prev.players.length,
        placedTiles: [],
        consecutivePasses
      }
    })
  }

  const makeAIMove = () => {
    // Simple AI: Try to make a word from tiles
    const player = gameState.players[gameState.currentPlayer]
    const letters = player.tiles.map(t => t.letter).join('')
    
    // Find a valid word from available tiles
    for (const word of gameState.validWords) {
      if (word.length <= player.tiles.length && word.length >= 2) {
        let canMake = true
        const usedTiles = [...player.tiles]
        
        for (const letter of word) {
          const tileIndex = usedTiles.findIndex(t => t.letter === letter)
          if (tileIndex === -1) {
            canMake = false
            break
          }
          usedTiles.splice(tileIndex, 1)
        }
        
        if (canMake) {
          // Find a place to put the word (simplified - just place horizontally from center)
          const startRow = 7
          const startCol = Math.floor((BOARD_SIZE - word.length) / 2)
          
          const placedTiles: PlacedTile[] = []
          for (let i = 0; i < word.length; i++) {
            const tile = player.tiles.find(t => t.letter === word[i])!
            placedTiles.push({ row: startRow, col: startCol + i, tile })
          }
          
          setGameState(prev => ({ ...prev, placedTiles }))
          setTimeout(() => submitWord(), 1000)
          return
        }
      }
    }
    
    // If no valid word, pass
    setTimeout(() => passTurn(), 1000)
  }

  const startGame = () => {
    const board = initializeBoard()
    const tileBag = createTileBag()
    const players = initializePlayers(1)
    
    // Give each player 7 tiles
    let currentBag = tileBag
    const dealtPlayers = players.map(player => {
      const { player: updatedPlayer, tileBag: newBag } = drawTiles(player, currentBag, 7)
      currentBag = newBag
      return updatedPlayer
    })

    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      board,
      players: dealtPlayers,
      currentPlayer: 0,
      tileBag: currentBag,
      placedTiles: [],
      consecutivePasses: 0,
      turnCount: 0,
      validWords: COMMON_WORDS
    })
  }

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing'
    }))
  }

  const toggleSound = () => {
    setGameState(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }))
  }

  // AI turns
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return
    
    const currentPlayer = gameState.players[gameState.currentPlayer]
    if (currentPlayer && currentPlayer.isAI) {
      const timer = setTimeout(() => makeAIMove(), 2000)
      return () => clearTimeout(timer)
    }
  }, [gameState.currentPlayer, gameState.gameStatus])

  // Save to localStorage
  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineScrabble_score', gameState.score.toString())
      localStorage.setItem('onlineScrabble_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  const getMultiplierColor = (multiplier: string | null) => {
    switch (multiplier) {
      case 'TW': return 'bg-red-500 text-white'
      case 'DW': return 'bg-pink-400 text-white'
      case 'TL': return 'bg-blue-500 text-white'
      case 'DL': return 'bg-blue-300 text-white'
      default: return 'bg-amber-50'
    }
  }

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Online Scrabble
            </h1>
            <p className="text-muted-foreground">Word game with dictionary validation!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Form words using letter tiles</li>
              <li>• Place tiles on the board</li>
              <li>• Use multiplier squares for bonus points</li>
              <li>• Valid words are checked automatically</li>
              <li>• Reach target score to advance levels</li>
            </ul>
          </div>
          
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
        </div>
      </Card>
    )
  }

  if (gameState.gameStatus === 'gameOver' || gameState.gameStatus === 'victory') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            {gameState.gameStatus === 'victory' ? (
              <>
                <Trophy className="w-8 h-8 text-yellow-500" />
                Victory!
              </>
            ) : (
              'Game Over!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {gameState.score}</p>
            <p className="text-lg text-muted-foreground">Level: {gameState.level}</p>
            <p className="text-lg text-muted-foreground">Turns: {gameState.turnCount}</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  const currentPlayer = gameState.players[gameState.currentPlayer]
  const isPlayerTurn = gameState.currentPlayer === 0

  return (
    <Card className="max-w-7xl mx-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
            <span className="text-lg font-semibold">Tiles Left: {gameState.tileBag.length}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={toggleSound}>
              {gameState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={togglePause}>
              {gameState.gameStatus === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Players */}
        <div className="flex gap-4">
          {gameState.players.map(player => (
            <div 
              key={player.id}
              className={`px-4 py-2 rounded ${
                gameState.currentPlayer === player.id ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100'
              }`}
            >
              <div className="font-semibold">{player.name}</div>
              <div className="text-sm">Score: {player.score}</div>
              <div className="text-sm">Tiles: {player.tiles.length}</div>
            </div>
          ))}
        </div>

        {/* Board */}
        <div className="overflow-x-auto">
          <div className="inline-block bg-amber-100 p-2 rounded">
            <div className="grid grid-cols-15 gap-0.5" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
              {gameState.board.map((row, i) => 
                row.map((cell, j) => {
                  const placedTile = gameState.placedTiles.find(p => p.row === i && p.col === j)
                  return (
                    <button
                      key={`${i}-${j}`}
                      onClick={() => {
                        if (placedTile) {
                          removePlacedTile(i, j)
                        } else if (isPlayerTurn) {
                          placeTile(i, j)
                        }
                      }}
                      onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`
                        w-10 h-10 border border-gray-300 flex items-center justify-center text-xs font-bold
                        ${getMultiplierColor(cell.multiplier)}
                        ${hoveredCell?.row === i && hoveredCell?.col === j ? 'ring-2 ring-yellow-400' : ''}
                        ${placedTile ? 'bg-yellow-200' : ''}
                      `}
                    >
                      {cell.tile ? (
                        <div className="relative">
                          <span>{cell.tile.letter}</span>
                          <span className="absolute -bottom-1 -right-1 text-[8px]">{cell.tile.value}</span>
                        </div>
                      ) : placedTile ? (
                        <div className="relative">
                          <span>{placedTile.tile.letter}</span>
                          <span className="absolute -bottom-1 -right-1 text-[8px]">{placedTile.tile.value}</span>
                        </div>
                      ) : (
                        <span className="text-[8px]">{cell.multiplier}</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Current Player's Tiles */}
        {isPlayerTurn && currentPlayer && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Your Tiles:</h3>
            <div className="flex gap-2">
              {currentPlayer.tiles.map((tile, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTileIndex(selectedTileIndex === i ? null : i)}
                  className={`
                    w-12 h-12 bg-amber-200 border-2 border-amber-400 rounded flex flex-col items-center justify-center
                    ${selectedTileIndex === i ? 'ring-2 ring-blue-500 bg-blue-100' : 'hover:bg-amber-300'}
                  `}
                >
                  <span className="text-lg font-bold">{tile.letter}</span>
                  <span className="text-xs">{tile.value}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isPlayerTurn && (
          <div className="flex gap-4">
            <Button 
              onClick={submitWord} 
              disabled={gameState.placedTiles.length === 0}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Submit Word ({gameState.placedTiles.length} tiles)
            </Button>
            <Button 
              onClick={() => setGameState(prev => ({ ...prev, placedTiles: [] }))}
              variant="outline"
              disabled={gameState.placedTiles.length === 0}
            >
              <X className="w-4 h-4" />
              Clear Tiles
            </Button>
            <Button onClick={passTurn} variant="destructive">
              Pass Turn
            </Button>
          </div>
        )}

        {/* Current Word */}
        {gameState.placedTiles.length > 0 && (
          <div className="text-center p-2 bg-yellow-100 rounded">
            Current Word: {getWordFromTiles(gameState.placedTiles, true)}
          </div>
        )}
      </div>
    </Card>
  )
}