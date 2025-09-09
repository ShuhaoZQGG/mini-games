'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface Tile {
  id: number
  type: string
  value: string | number
  x: number
  y: number
  z: number
  visible: boolean
  selected: boolean
  matched: boolean
}

interface GameState {
  tiles: Tile[]
  selectedTile: Tile | null
  score: number
  moves: number
  timeElapsed: number
  gameWon: boolean
  gameLost: boolean
  hint: number[]
}

// Define tile types and values
const TILE_TYPES = {
  dots: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  bamboo: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  characters: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  winds: ['E', 'S', 'W', 'N'],
  dragons: ['R', 'G', 'W'],
  flowers: ['P', 'O', 'C', 'B'],
  seasons: ['Sp', 'Su', 'Au', 'Wi'],
}

// Classic turtle layout
const TURTLE_LAYOUT = [
  // Layer 0 (bottom)
  ...Array.from({ length: 12 }, (_, i) => ({ x: i - 5.5, y: -3, z: 0 })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: i - 5.5, y: -2, z: 0 })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: i - 5.5, y: -1, z: 0 })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: i - 5.5, y: 0, z: 0 })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: i - 5.5, y: 1, z: 0 })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: i - 5.5, y: 2, z: 0 })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: i - 5.5, y: 3, z: 0 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: i - 3.5, y: 4, z: 0 })),
  
  // Layer 1
  ...Array.from({ length: 10 }, (_, i) => ({ x: i - 4.5, y: -2.5, z: 1 })),
  ...Array.from({ length: 10 }, (_, i) => ({ x: i - 4.5, y: -1.5, z: 1 })),
  ...Array.from({ length: 10 }, (_, i) => ({ x: i - 4.5, y: -0.5, z: 1 })),
  ...Array.from({ length: 10 }, (_, i) => ({ x: i - 4.5, y: 0.5, z: 1 })),
  ...Array.from({ length: 10 }, (_, i) => ({ x: i - 4.5, y: 1.5, z: 1 })),
  ...Array.from({ length: 10 }, (_, i) => ({ x: i - 4.5, y: 2.5, z: 1 })),
  
  // Layer 2
  ...Array.from({ length: 8 }, (_, i) => ({ x: i - 3.5, y: -2, z: 2 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: i - 3.5, y: -1, z: 2 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: i - 3.5, y: 0, z: 2 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: i - 3.5, y: 1, z: 2 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: i - 3.5, y: 2, z: 2 })),
  
  // Layer 3
  ...Array.from({ length: 6 }, (_, i) => ({ x: i - 2.5, y: -1.5, z: 3 })),
  ...Array.from({ length: 6 }, (_, i) => ({ x: i - 2.5, y: -0.5, z: 3 })),
  ...Array.from({ length: 6 }, (_, i) => ({ x: i - 2.5, y: 0.5, z: 3 })),
  ...Array.from({ length: 6 }, (_, i) => ({ x: i - 2.5, y: 1.5, z: 3 })),
  
  // Top layer
  { x: 0, y: 0, z: 4 },
]

const generateTiles = (): Tile[] => {
  const tiles: Tile[] = []
  let id = 0
  
  // Create pairs of tiles
  const tilePairs: { type: string; value: string | number }[] = []
  
  // Add standard tiles (4 of each)
  Object.entries(TILE_TYPES).forEach(([type, values]) => {
    if (type !== 'flowers' && type !== 'seasons') {
      values.forEach(value => {
        for (let i = 0; i < 4; i++) {
          tilePairs.push({ type, value })
        }
      })
    }
  })
  
  // Add flowers and seasons (1 of each, but they can match with any in their group)
  TILE_TYPES.flowers.forEach(value => tilePairs.push({ type: 'flowers', value }))
  TILE_TYPES.seasons.forEach(value => tilePairs.push({ type: 'seasons', value }))
  
  // Shuffle tile pairs
  for (let i = tilePairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tilePairs[i], tilePairs[j]] = [tilePairs[j], tilePairs[i]]
  }
  
  // Assign tiles to positions (using only 144 tiles for standard game)
  const positions = TURTLE_LAYOUT.slice(0, 144)
  positions.forEach((pos, index) => {
    if (index < tilePairs.length) {
      tiles.push({
        id: id++,
        type: tilePairs[index].type,
        value: tilePairs[index].value,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        visible: true,
        selected: false,
        matched: false,
      })
    }
  })
  
  return tiles
}

export default function MahjongSolitaireGame() {
  const [gameState, setGameState] = useState<GameState>({
    tiles: generateTiles(),
    selectedTile: null,
    score: 0,
    moves: 0,
    timeElapsed: 0,
    gameWon: false,
    gameLost: false,
    hint: [],
  })
  
  const [showTimer, setShowTimer] = useState(true)

  // Timer
  useEffect(() => {
    if (!gameState.gameWon && !gameState.gameLost) {
      const timer = setInterval(() => {
        setGameState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState.gameWon, gameState.gameLost])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isTileFree = useCallback((tile: Tile, tiles: Tile[]): boolean => {
    // A tile is free if it has no tile on top and at least one side (left or right) is free
    const hasTopTile = tiles.some(t => 
      !t.matched &&
      t.z === tile.z + 1 &&
      Math.abs(t.x - tile.x) < 0.9 &&
      Math.abs(t.y - tile.y) < 0.9
    )
    
    if (hasTopTile) return false
    
    const hasLeftTile = tiles.some(t =>
      !t.matched &&
      t.z === tile.z &&
      Math.abs(t.y - tile.y) < 0.9 &&
      t.x === tile.x - 1
    )
    
    const hasRightTile = tiles.some(t =>
      !t.matched &&
      t.z === tile.z &&
      Math.abs(t.y - tile.y) < 0.9 &&
      t.x === tile.x + 1
    )
    
    return !hasLeftTile || !hasRightTile
  }, [])

  const canMatch = (tile1: Tile, tile2: Tile): boolean => {
    if (tile1.id === tile2.id) return false
    
    // Flowers can match with any flower, seasons with any season
    if (tile1.type === 'flowers' && tile2.type === 'flowers') return true
    if (tile1.type === 'seasons' && tile2.type === 'seasons') return true
    
    // Other tiles must match exactly
    return tile1.type === tile2.type && tile1.value === tile2.value
  }

  const selectTile = useCallback((tile: Tile) => {
    if (tile.matched || gameState.gameWon || gameState.gameLost) return
    if (!isTileFree(tile, gameState.tiles)) {
      toast.error('This tile is blocked!')
      return
    }
    
    const newTiles = [...gameState.tiles]
    const tileIndex = newTiles.findIndex(t => t.id === tile.id)
    
    if (gameState.selectedTile) {
      if (gameState.selectedTile.id === tile.id) {
        // Deselect
        newTiles[tileIndex].selected = false
        setGameState(prev => ({ ...prev, tiles: newTiles, selectedTile: null }))
      } else if (canMatch(gameState.selectedTile, tile)) {
        // Match found!
        const selectedIndex = newTiles.findIndex(t => t.id === gameState.selectedTile!.id)
        newTiles[selectedIndex].matched = true
        newTiles[selectedIndex].selected = false
        newTiles[tileIndex].matched = true
        
        const newScore = gameState.score + 100
        const newMoves = gameState.moves + 1
        
        // Check for win
        const remainingTiles = newTiles.filter(t => !t.matched)
        const gameWon = remainingTiles.length === 0
        
        // Check for available moves
        let hasAvailableMoves = false
        if (!gameWon) {
          for (let i = 0; i < remainingTiles.length; i++) {
            for (let j = i + 1; j < remainingTiles.length; j++) {
              if (isTileFree(remainingTiles[i], newTiles) &&
                  isTileFree(remainingTiles[j], newTiles) &&
                  canMatch(remainingTiles[i], remainingTiles[j])) {
                hasAvailableMoves = true
                break
              }
            }
            if (hasAvailableMoves) break
          }
        }
        
        setGameState(prev => ({
          ...prev,
          tiles: newTiles,
          selectedTile: null,
          score: newScore,
          moves: newMoves,
          gameWon,
          gameLost: !gameWon && !hasAvailableMoves,
          hint: [],
        }))
        
        if (gameWon) {
          toast.success('Congratulations! You won!')
        } else if (!hasAvailableMoves) {
          toast.error('No more moves available!')
        }
      } else {
        // Select different tile
        const oldSelectedIndex = newTiles.findIndex(t => t.id === gameState.selectedTile!.id)
        newTiles[oldSelectedIndex].selected = false
        newTiles[tileIndex].selected = true
        setGameState(prev => ({ ...prev, tiles: newTiles, selectedTile: tile }))
      }
    } else {
      // First selection
      newTiles[tileIndex].selected = true
      setGameState(prev => ({ ...prev, tiles: newTiles, selectedTile: tile }))
    }
  }, [gameState, isTileFree])

  const showHint = useCallback(() => {
    const tiles = gameState.tiles.filter(t => !t.matched)
    
    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        if (isTileFree(tiles[i], gameState.tiles) &&
            isTileFree(tiles[j], gameState.tiles) &&
            canMatch(tiles[i], tiles[j])) {
          setGameState(prev => ({ 
            ...prev, 
            hint: [tiles[i].id, tiles[j].id],
            score: Math.max(0, prev.score - 50) // Penalty for using hint
          }))
          setTimeout(() => {
            setGameState(prev => ({ ...prev, hint: [] }))
          }, 2000)
          return
        }
      }
    }
    
    toast.error('No hints available!')
  }, [gameState.tiles, isTileFree])

  const resetGame = () => {
    setGameState({
      tiles: generateTiles(),
      selectedTile: null,
      score: 0,
      moves: 0,
      timeElapsed: 0,
      gameWon: false,
      gameLost: false,
      hint: [],
    })
  }

  const getTileDisplay = (tile: Tile): string => {
    if (tile.type === 'dots') return `${tile.value}●`
    if (tile.type === 'bamboo') return `${tile.value}|`
    if (tile.type === 'characters') return `${tile.value}萬`
    if (tile.type === 'winds') return tile.value as string
    if (tile.type === 'dragons') {
      if (tile.value === 'R') return '中'
      if (tile.value === 'G') return '發'
      return '白'
    }
    if (tile.type === 'flowers') return '🌸'
    if (tile.type === 'seasons') return '🍂'
    return ''
  }

  const getTileColor = (tile: Tile): string => {
    if (tile.type === 'dots') return 'text-blue-600'
    if (tile.type === 'bamboo') return 'text-green-600'
    if (tile.type === 'characters') return 'text-red-600'
    if (tile.type === 'winds') return 'text-purple-600'
    if (tile.type === 'dragons') {
      if (tile.value === 'R') return 'text-red-500'
      if (tile.value === 'G') return 'text-green-500'
      return 'text-gray-700'
    }
    if (tile.type === 'flowers') return 'text-pink-500'
    if (tile.type === 'seasons') return 'text-orange-500'
    return ''
  }

  return (
    <Card className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Mahjong Solitaire</h1>
        <p className="text-gray-600">Match pairs of free tiles to clear the board</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div>
            <span className="text-sm text-gray-600">Score:</span>
            <p className="text-xl font-bold">{gameState.score}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Moves:</span>
            <p className="text-xl font-bold">{gameState.moves}</p>
          </div>
          {showTimer && (
            <div>
              <span className="text-sm text-gray-600">Time:</span>
              <p className="text-xl font-bold">{formatTime(gameState.timeElapsed)}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={showHint} size="sm" variant="outline">
            Hint (-50)
          </Button>
          <Button onClick={() => setShowTimer(!showTimer)} size="sm" variant="outline">
            {showTimer ? 'Hide' : 'Show'} Timer
          </Button>
          <Button onClick={resetGame} size="sm">
            New Game
          </Button>
        </div>
      </div>

      <div className="relative bg-green-100 rounded-lg p-8 min-h-[600px] overflow-auto">
        <div className="relative" style={{ width: '800px', height: '600px', margin: '0 auto' }}>
          {gameState.tiles.filter(t => !t.matched).map(tile => {
            const isFree = isTileFree(tile, gameState.tiles)
            const isHinted = gameState.hint.includes(tile.id)
            
            return (
              <div
                key={tile.id}
                className={`absolute w-14 h-20 bg-white rounded shadow-lg border-2 flex items-center justify-center cursor-pointer transition-all
                  ${tile.selected ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300'}
                  ${!isFree ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl'}
                  ${isHinted ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                `}
                style={{
                  left: `${400 + tile.x * 50}px`,
                  top: `${300 + tile.y * 45 - tile.z * 10}px`,
                  zIndex: tile.z * 100 + tile.y * 10,
                }}
                onClick={() => selectTile(tile)}
              >
                <span className={`text-2xl font-bold ${getTileColor(tile)}`}>
                  {getTileDisplay(tile)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {(gameState.gameWon || gameState.gameLost) && (
        <div className="text-center mt-6">
          <h2 className="text-2xl font-bold mb-4">
            {gameState.gameWon ? 'Congratulations! You Won!' : 'Game Over - No More Moves'}
          </h2>
          <div className="text-lg mb-4">
            <p>Final Score: {gameState.score}</p>
            <p>Moves: {gameState.moves}</p>
            <p>Time: {formatTime(gameState.timeElapsed)}</p>
          </div>
          <Button onClick={resetGame}>Play Again</Button>
        </div>
      )}
    </Card>
  )
}