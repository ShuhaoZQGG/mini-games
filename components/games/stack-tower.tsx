'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw } from 'lucide-react'

interface Block {
  x: number
  width: number
  color: string
}

const INITIAL_WIDTH = 150
const BLOCK_HEIGHT = 30
const GAME_HEIGHT = 500
const GAME_WIDTH = 400
const SPEED_INCREMENT = 0.5

export default function StackTower() {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [speed, setSpeed] = useState(3)
  const [direction, setDirection] = useState(1)
  const animationRef = useRef<number | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('stackTowerHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  const getRandomColor = () => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const startGame = () => {
    const firstBlock = {
      x: GAME_WIDTH / 2 - INITIAL_WIDTH / 2,
      width: INITIAL_WIDTH,
      color: getRandomColor()
    }
    setBlocks([firstBlock])
    setCurrentBlock({
      x: 0,
      width: INITIAL_WIDTH,
      color: getRandomColor()
    })
    setScore(0)
    setSpeed(3)
    setDirection(1)
    setGameState('playing')
  }

  const resetGame = () => {
    setGameState('waiting')
    setBlocks([])
    setCurrentBlock(null)
    setScore(0)
    setSpeed(3)
    setDirection(1)
  }

  const placeBlock = useCallback(() => {
    if (gameState !== 'playing' || !currentBlock) return

    const lastBlock = blocks[blocks.length - 1]
    
    // Calculate overlap
    const overlapLeft = Math.max(currentBlock.x, lastBlock.x)
    const overlapRight = Math.min(
      currentBlock.x + currentBlock.width,
      lastBlock.x + lastBlock.width
    )
    const overlapWidth = overlapRight - overlapLeft

    if (overlapWidth <= 0) {
      // No overlap - game over
      setGameState('gameOver')
      if (score > highScore) {
        setHighScore(score)
        localStorage.setItem('stackTowerHighScore', score.toString())
      }
      return
    }

    // Perfect placement bonus
    const isPerfect = Math.abs(currentBlock.x - lastBlock.x) < 5
    const points = isPerfect ? 50 : 10
    
    // Add the overlapping part as a new block
    const newBlock = {
      x: overlapLeft,
      width: overlapWidth,
      color: currentBlock.color
    }

    setBlocks(prev => [...prev, newBlock])
    setScore(prev => prev + points)
    
    // Create new moving block
    setCurrentBlock({
      x: 0,
      width: overlapWidth,
      color: getRandomColor()
    })
    
    // Increase speed slightly
    setSpeed(prev => prev + SPEED_INCREMENT)
    
    // Check if tower is too tall
    if (blocks.length >= Math.floor(GAME_HEIGHT / BLOCK_HEIGHT) - 2) {
      setGameState('gameOver')
      if (score + points > highScore) {
        setHighScore(score + points)
        localStorage.setItem('stackTowerHighScore', (score + points).toString())
      }
    }
  }, [gameState, currentBlock, blocks, score, highScore])

  // Animation loop for moving block
  useEffect(() => {
    if (gameState === 'playing' && currentBlock) {
      const animate = () => {
        setCurrentBlock(prev => {
          if (!prev) return null
          
          let newX = prev.x + speed * direction
          
          // Bounce off walls
          if (newX <= 0 || newX + prev.width >= GAME_WIDTH) {
            setDirection(d => -d)
            newX = Math.max(0, Math.min(GAME_WIDTH - prev.width, newX))
          }
          
          return { ...prev, x: newX }
        })
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, currentBlock, speed, direction])

  // Handle click/tap to place block
  useEffect(() => {
    const handleClick = () => {
      if (gameState === 'playing') {
        placeBlock()
      }
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault()
        placeBlock()
      }
    }

    if (containerRef.current) {
      containerRef.current.addEventListener('click', handleClick)
    }
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick)
      }
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [gameState, placeBlock])

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Stack Tower</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Click or press Space to stack blocks perfectly!
            </p>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold">
              Score: <span className="text-blue-600">{score}</span>
            </div>
            <div className="text-lg font-semibold">
              Height: <span className="text-green-600">{blocks.length}</span>
            </div>
            <div className="text-lg font-semibold">
              Best: <span className="text-purple-600">{highScore}</span>
            </div>
          </div>

          <div 
            ref={containerRef}
            className="relative mx-auto bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-lg cursor-pointer"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Stacked blocks */}
            {blocks.map((block, index) => (
              <div
                key={index}
                className={`absolute ${block.color} transition-all duration-75`}
                style={{
                  bottom: index * BLOCK_HEIGHT,
                  left: block.x,
                  width: block.width,
                  height: BLOCK_HEIGHT
                }}
              />
            ))}

            {/* Current moving block */}
            {currentBlock && gameState === 'playing' && (
              <div
                className={`absolute ${currentBlock.color}`}
                style={{
                  bottom: blocks.length * BLOCK_HEIGHT,
                  left: currentBlock.x,
                  width: currentBlock.width,
                  height: BLOCK_HEIGHT
                }}
              />
            )}

            {/* Game state overlays */}
            {gameState === 'waiting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Stack Tower</h3>
                  <p className="mb-4">Stack blocks as high as you can!</p>
                  <Button onClick={startGame} variant="secondary">
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                </div>
              </div>
            )}

            {gameState === 'gameOver' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
                  <p className="mb-2">Final Score: {score}</p>
                  <p className="mb-4">Tower Height: {blocks.length}</p>
                  <Button onClick={resetGame} variant="secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            {gameState === 'waiting' && (
              <Button onClick={startGame} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Building
              </Button>
            )}
            {gameState === 'playing' && (
              <p className="text-gray-600 dark:text-gray-400">
                Click or press Space to place the block!
              </p>
            )}
            {gameState === 'gameOver' && (
              <Button onClick={resetGame} size="lg">
                <RotateCcw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Perfect placement = 50 points!</p>
            <p>Normal placement = 10 points</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}