'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Shuffle, Lightbulb, Trophy, Clock, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type TileType = {
  id: number
  type: string
  symbol: string
  layer: number
  row: number
  col: number
  blocked: boolean
  selected?: boolean
  matched?: boolean
}

type Layout = 'Dragon' | 'Pyramid' | 'Butterfly' | 'Fortress'

const TILE_TYPES = [
  { type: 'bamboo', symbols: ['🎋', '🎍', '🌿', '🌾', '🍀', '🌱', '🌲', '🌳', '🌴'] },
  { type: 'circles', symbols: ['⭕', '🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '🟤', '⚪'] },
  { type: 'characters', symbols: ['一', '二', '三', '四', '五', '六', '七', '八', '九'] },
  { type: 'honors', symbols: ['🀄', '🎯', '💎', '🔥', '💨', '⛰️', '🌊'] },
]

const MahjongSolitaire: React.FC = () => {
  const [tiles, setTiles] = useState<TileType[]>([])
  const [selectedTile, setSelectedTile] = useState<TileType | null>(null)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [hints, setHints] = useState(3)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [gameState, setGameState] = useState<'playing' | 'won' | 'stuck'>('playing')
  const [layout, setLayout] = useState<Layout>('Dragon')
  const [level, setLevel] = useState(1)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [totalPairs, setTotalPairs] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)
  const [showHintAnimation, setShowHintAnimation] = useState<number[]>([])

  const generateLayout = useCallback((layoutType: Layout, levelNum: number) => {
    const newTiles: TileType[] = []
    let tileId = 0
    
    // Generate tile pairs based on layout
    const pairCount = Math.min(36 + levelNum * 4, 72) // Max 144 tiles (72 pairs)
    const tilePairs: string[] = []
    
    for (let i = 0; i < pairCount; i++) {
      const typeGroup = TILE_TYPES[i % TILE_TYPES.length]
      const symbol = typeGroup.symbols[i % typeGroup.symbols.length]
      tilePairs.push(symbol, symbol) // Add each tile twice for pairs
    }
    
    // Shuffle the tiles
    for (let i = tilePairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[tilePairs[i], tilePairs[j]] = [tilePairs[j], tilePairs[i]]
    }
    
    // Create layout positions based on type
    const positions: { layer: number; row: number; col: number }[] = []
    
    switch (layoutType) {
      case 'Dragon':
        // Dragon shape - elongated with wings
        for (let layer = 0; layer < 3; layer++) {
          const layerWidth = 12 - layer * 2
          const layerHeight = 8 - layer
          for (let row = 0; row < layerHeight; row++) {
            for (let col = 0; col < layerWidth; col++) {
              if (positions.length < tilePairs.length) {
                positions.push({ layer, row: row + layer, col: col + layer })
              }
            }
          }
        }
        break
        
      case 'Pyramid':
        // Pyramid shape - triangular layers
        for (let layer = 0; layer < 4; layer++) {
          const size = 8 - layer * 2
          for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
              if (positions.length < tilePairs.length) {
                positions.push({ layer, row: row + layer, col: col + layer })
              }
            }
          }
        }
        break
        
      case 'Butterfly':
        // Butterfly shape - two wings
        for (let layer = 0; layer < 2; layer++) {
          // Left wing
          for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 4; col++) {
              if (positions.length < tilePairs.length) {
                positions.push({ layer, row: row + layer, col: col + layer })
              }
            }
          }
          // Right wing
          for (let row = 0; row < 6; row++) {
            for (let col = 8; col < 12; col++) {
              if (positions.length < tilePairs.length) {
                positions.push({ layer, row: row + layer, col: col + layer - 4 })
              }
            }
          }
        }
        break
        
      case 'Fortress':
        // Fortress shape - square with walls
        for (let layer = 0; layer < 3; layer++) {
          const size = 10 - layer * 2
          for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
              if (layer === 0 || row === 0 || row === size - 1 || col === 0 || col === size - 1) {
                if (positions.length < tilePairs.length) {
                  positions.push({ layer, row: row + layer, col: col + layer })
                }
              }
            }
          }
        }
        break
    }
    
    // Create tiles from positions
    positions.forEach((pos, index) => {
      if (index < tilePairs.length) {
        newTiles.push({
          id: tileId++,
          type: 'mahjong',
          symbol: tilePairs[index],
          layer: pos.layer,
          row: pos.row,
          col: pos.col,
          blocked: false,
          selected: false,
          matched: false
        })
      }
    })
    
    setTotalPairs(Math.floor(newTiles.length / 2))
    return newTiles
  }, [])

  const checkIfBlocked = useCallback((tile: TileType, allTiles: TileType[]) => {
    // A tile is blocked if it has tiles on top or tiles on both left and right sides at the same layer
    const hasTopTile = allTiles.some(t => 
      !t.matched &&
      t.layer === tile.layer + 1 &&
      Math.abs(t.row - tile.row) < 1 &&
      Math.abs(t.col - tile.col) < 1
    )
    
    if (hasTopTile) return true
    
    const leftTile = allTiles.some(t => 
      !t.matched &&
      t.layer === tile.layer &&
      t.row === tile.row &&
      t.col === tile.col - 1
    )
    
    const rightTile = allTiles.some(t => 
      !t.matched &&
      t.layer === tile.layer &&
      t.row === tile.row &&
      t.col === tile.col + 1
    )
    
    return leftTile && rightTile
  }, [])

  const updateBlockedStatus = useCallback((currentTiles: TileType[]) => {
    return currentTiles.map(tile => ({
      ...tile,
      blocked: tile.matched ? false : checkIfBlocked(tile, currentTiles)
    }))
  }, [checkIfBlocked])

  const handleTileClick = useCallback((clickedTile: TileType) => {
    if (clickedTile.blocked || clickedTile.matched || gameState !== 'playing') return
    
    if (!selectedTile) {
      setSelectedTile(clickedTile)
      setTiles(prev => prev.map(t => ({
        ...t,
        selected: t.id === clickedTile.id
      })))
    } else if (selectedTile.id === clickedTile.id) {
      setSelectedTile(null)
      setTiles(prev => prev.map(t => ({
        ...t,
        selected: false
      })))
    } else if (selectedTile.symbol === clickedTile.symbol) {
      // Match found!
      const newTiles = tiles.map(t => ({
        ...t,
        matched: t.id === selectedTile.id || t.id === clickedTile.id || t.matched,
        selected: false
      }))
      
      setTiles(updateBlockedStatus(newTiles))
      setSelectedTile(null)
      setScore(prev => prev + 100 + level * 10)
      setMatchedPairs(prev => prev + 1)
      setMoves(prev => prev + 1)
      
      // Check for win
      const remainingTiles = newTiles.filter(t => !t.matched)
      if (remainingTiles.length === 0) {
        setGameState('won')
        setScore(prev => prev + 1000 * level + hints * 100)
      } else {
        // Check if stuck
        const availableTiles = remainingTiles.filter(t => !checkIfBlocked(t, newTiles))
        const hasMatch = availableTiles.some((t1, i) => 
          availableTiles.slice(i + 1).some(t2 => t1.symbol === t2.symbol)
        )
        if (!hasMatch) {
          setGameState('stuck')
        }
      }
    } else {
      // No match - switch selection
      setSelectedTile(clickedTile)
      setTiles(prev => prev.map(t => ({
        ...t,
        selected: t.id === clickedTile.id
      })))
      setMoves(prev => prev + 1)
    }
  }, [selectedTile, tiles, gameState, level, hints, checkIfBlocked, updateBlockedStatus])

  const findHint = useCallback(() => {
    if (hints <= 0 || gameState !== 'playing') return
    
    const availableTiles = tiles.filter(t => !t.matched && !t.blocked)
    
    for (let i = 0; i < availableTiles.length; i++) {
      for (let j = i + 1; j < availableTiles.length; j++) {
        if (availableTiles[i].symbol === availableTiles[j].symbol) {
          setShowHintAnimation([availableTiles[i].id, availableTiles[j].id])
          setHints(prev => prev - 1)
          setTimeout(() => setShowHintAnimation([]), 2000)
          return
        }
      }
    }
  }, [tiles, hints, gameState])

  const shuffleTiles = useCallback(() => {
    if (gameState !== 'playing' || isShuffling) return
    
    setIsShuffling(true)
    const unmatchedTiles = tiles.filter(t => !t.matched)
    const symbols = unmatchedTiles.map(t => t.symbol)
    
    // Shuffle symbols
    for (let i = symbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[symbols[i], symbols[j]] = [symbols[j], symbols[i]]
    }
    
    // Apply shuffled symbols back
    let symbolIndex = 0
    const newTiles = tiles.map(tile => {
      if (!tile.matched) {
        return {
          ...tile,
          symbol: symbols[symbolIndex++],
          selected: false
        }
      }
      return tile
    })
    
    setTiles(updateBlockedStatus(newTiles))
    setSelectedTile(null)
    setScore(prev => Math.max(0, prev - 50))
    
    setTimeout(() => setIsShuffling(false), 500)
  }, [tiles, gameState, isShuffling, updateBlockedStatus])

  const resetGame = useCallback(() => {
    const newTiles = generateLayout(layout, level)
    setTiles(updateBlockedStatus(newTiles))
    setSelectedTile(null)
    setScore(0)
    setMoves(0)
    setHints(3)
    setTimeElapsed(0)
    setMatchedPairs(0)
    setGameState('playing')
    setShowHintAnimation([])
  }, [layout, level, generateLayout, updateBlockedStatus])

  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1)
    const layouts: Layout[] = ['Dragon', 'Pyramid', 'Butterfly', 'Fortress']
    setLayout(layouts[(level) % layouts.length])
    resetGame()
  }, [level, resetGame])

  // Initialize game
  useEffect(() => {
    resetGame()
  }, [])

  // Timer
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Mahjong Solitaire - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>{matchedPairs}/{totalPairs}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={findHint}
              disabled={hints <= 0 || gameState !== 'playing'}
              variant="outline"
              size="sm"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint ({hints})
            </Button>
            <Button
              onClick={shuffleTiles}
              disabled={gameState !== 'playing' || isShuffling}
              variant="outline"
              size="sm"
            >
              <Shuffle className="w-4 h-4 mr-1" />
              Shuffle
            </Button>
            <Button onClick={resetGame} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-2">
          Layout: {layout} | Moves: {moves}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[600px] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-8">
          <AnimatePresence>
            {tiles.map((tile) => (
              <motion.div
                key={tile.id}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ 
                  scale: tile.matched ? 0 : 1,
                  rotateY: tile.matched ? 180 : 0,
                  x: tile.col * 50 + tile.layer * 2,
                  y: tile.row * 60 + tile.layer * 2,
                }}
                exit={{ scale: 0, rotateY: 180 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "absolute w-12 h-16 cursor-pointer select-none",
                  tile.blocked && "opacity-70",
                  showHintAnimation.includes(tile.id) && "animate-pulse"
                )}
                style={{
                  zIndex: tile.layer * 100 + tile.row * 10 + tile.col,
                }}
                onClick={() => handleTileClick(tile)}
              >
                <div
                  className={cn(
                    "w-full h-full rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all",
                    "bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900",
                    tile.selected && "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/50 shadow-lg scale-105",
                    !tile.selected && !tile.blocked && "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:shadow-md",
                    tile.blocked && "border-gray-400 dark:border-gray-700 cursor-not-allowed",
                    isShuffling && "animate-spin"
                  )}
                  style={{
                    boxShadow: `${tile.layer * 2}px ${tile.layer * 2}px ${tile.layer * 4}px rgba(0,0,0,0.2)`
                  }}
                >
                  {tile.symbol}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {gameState === 'won' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Congratulations! 🎉</h2>
                <p className="text-xl mb-2">Level {level} Complete!</p>
                <p className="text-lg mb-4">Final Score: {score}</p>
                <p className="text-md mb-4">Time: {formatTime(timeElapsed)}</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={nextLevel}>Next Level</Button>
                  <Button onClick={resetGame} variant="outline">Play Again</Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {gameState === 'stuck' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4">No More Moves! 😕</h2>
                <p className="text-lg mb-4">Try shuffling the tiles or starting over.</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={shuffleTiles}>Shuffle Tiles</Button>
                  <Button onClick={resetGame} variant="outline">New Game</Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default MahjongSolitaire