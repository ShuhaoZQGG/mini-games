'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface MazeRunnerProps {
  onGameEnd?: (score: number) => void
  level?: number
}

type Cell = {
  x: number
  y: number
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean }
  visited: boolean
}

export default function MazeRunner({ onGameEnd, level = 1 }: MazeRunnerProps) {
  const mazeSize = Math.min(5 + level, 15)
  const [maze, setMaze] = useState<Cell[][]>([])
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 })
  const [exitPos, setExitPos] = useState({ x: mazeSize - 1, y: mazeSize - 1 })
  const [moves, setMoves] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [path, setPath] = useState<{x: number, y: number}[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('mazerunner-highscore')
    if (saved) setHighScore(parseInt(saved))
    generateMaze()
  }, [level])

  useEffect(() => {
    if (!gameWon) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameWon])

  const generateMaze = () => {
    // Initialize maze grid
    const newMaze: Cell[][] = []
    for (let y = 0; y < mazeSize; y++) {
      newMaze[y] = []
      for (let x = 0; x < mazeSize; x++) {
        newMaze[y][x] = {
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false
        }
      }
    }

    // Generate maze using recursive backtracking
    const stack: Cell[] = []
    const current = newMaze[0][0]
    current.visited = true
    stack.push(current)

    while (stack.length > 0) {
      const cell = stack[stack.length - 1]
      const neighbors = getUnvisitedNeighbors(cell, newMaze)

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)]
        removeWall(cell, next, newMaze)
        next.visited = true
        stack.push(next)
      } else {
        stack.pop()
      }
    }

    // Reset visited for gameplay
    newMaze.forEach(row => row.forEach(cell => cell.visited = false))
    setMaze(newMaze)
    setPlayerPos({ x: 0, y: 0 })
    setExitPos({ x: mazeSize - 1, y: mazeSize - 1 })
    setPath([{ x: 0, y: 0 }])
    setMoves(0)
    setTimeElapsed(0)
    setGameWon(false)
  }

  const getUnvisitedNeighbors = (cell: Cell, maze: Cell[][]) => {
    const neighbors: Cell[] = []
    const { x, y } = cell

    if (y > 0 && !maze[y - 1][x].visited) neighbors.push(maze[y - 1][x])
    if (x < mazeSize - 1 && !maze[y][x + 1].visited) neighbors.push(maze[y][x + 1])
    if (y < mazeSize - 1 && !maze[y + 1][x].visited) neighbors.push(maze[y + 1][x])
    if (x > 0 && !maze[y][x - 1].visited) neighbors.push(maze[y][x - 1])

    return neighbors
  }

  const removeWall = (current: Cell, next: Cell, maze: Cell[][]) => {
    const dx = current.x - next.x
    const dy = current.y - next.y

    if (dx === 1) {
      maze[current.y][current.x].walls.left = false
      maze[next.y][next.x].walls.right = false
    } else if (dx === -1) {
      maze[current.y][current.x].walls.right = false
      maze[next.y][next.x].walls.left = false
    } else if (dy === 1) {
      maze[current.y][current.x].walls.top = false
      maze[next.y][next.x].walls.bottom = false
    } else if (dy === -1) {
      maze[current.y][current.x].walls.bottom = false
      maze[next.y][next.x].walls.top = false
    }
  }

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameWon || maze.length === 0) return

    const { x, y } = playerPos
    const cell = maze[y][x]
    let newX = x
    let newY = y

    if (direction === 'up' && !cell.walls.top && y > 0) newY--
    else if (direction === 'down' && !cell.walls.bottom && y < mazeSize - 1) newY++
    else if (direction === 'left' && !cell.walls.left && x > 0) newX--
    else if (direction === 'right' && !cell.walls.right && x < mazeSize - 1) newX++

    if (newX !== x || newY !== y) {
      setPlayerPos({ x: newX, y: newY })
      setPath([...path, { x: newX, y: newY }])
      setMoves(moves + 1)

      if (newX === exitPos.x && newY === exitPos.y) {
        const baseScore = 10000 * level
        const timePenalty = timeElapsed * 10
        const movePenalty = moves * 5
        const finalScore = Math.max(0, baseScore - timePenalty - movePenalty)
        
        setScore(finalScore)
        setGameWon(true)
        
        if (finalScore > highScore) {
          setHighScore(finalScore)
          localStorage.setItem('mazerunner-highscore', finalScore.toString())
        }
        onGameEnd?.(finalScore)
      }
    }
  }, [playerPos, maze, gameWon, exitPos, moves, timeElapsed, level, highScore, onGameEnd, mazeSize, path])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') movePlayer('up')
      else if (e.key === 'ArrowDown' || e.key === 's') movePlayer('down')
      else if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer('left')
      else if (e.key === 'ArrowRight' || e.key === 'd') movePlayer('right')
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [movePlayer])

  const cellSize = Math.min(40, 600 / mazeSize)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Maze Runner</h1>
        
        <div className="flex justify-around mb-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Level</p>
            <p className="text-xl font-bold">{level}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Moves</p>
            <p className="text-xl font-bold">{moves}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Time</p>
            <p className="text-xl font-bold">{timeElapsed}s</p>
          </div>
        </div>

        <div 
          className="relative bg-gray-100 rounded-lg p-4 mb-4"
          style={{ width: 'fit-content', margin: '0 auto' }}
        >
          <div 
            className="relative"
            style={{
              width: `${mazeSize * cellSize}px`,
              height: `${mazeSize * cellSize}px`
            }}
          >
            {maze.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className="absolute bg-white"
                  style={{
                    left: `${x * cellSize}px`,
                    top: `${y * cellSize}px`,
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    borderTop: cell.walls.top ? '2px solid #333' : 'none',
                    borderRight: cell.walls.right ? '2px solid #333' : 'none',
                    borderBottom: cell.walls.bottom ? '2px solid #333' : 'none',
                    borderLeft: cell.walls.left ? '2px solid #333' : 'none',
                    backgroundColor: 
                      x === exitPos.x && y === exitPos.y ? '#10b981' :
                      path.some(p => p.x === x && p.y === y) ? '#fef3c7' : 'white'
                  }}
                >
                  {x === exitPos.x && y === exitPos.y && (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🏁
                    </div>
                  )}
                </div>
              ))
            )}
            
            <motion.div
              animate={{
                left: `${playerPos.x * cellSize + cellSize / 4}px`,
                top: `${playerPos.y * cellSize + cellSize / 4}px`
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bg-blue-500 rounded-full"
              style={{
                width: `${cellSize / 2}px`,
                height: `${cellSize / 2}px`
              }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => movePlayer('up')}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            ↑
          </button>
        </div>
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => movePlayer('left')}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            ←
          </button>
          <button
            onClick={() => movePlayer('down')}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            ↓
          </button>
          <button
            onClick={() => movePlayer('right')}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            →
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mb-4">
          Use arrow keys or WASD to move
        </p>

        {gameWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-green-600 mb-2">🎉 You Win!</h2>
            <p className="text-lg mb-2">Score: {score}</p>
            <p className="text-sm text-gray-600 mb-4">High Score: {highScore}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateMaze}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              New Maze
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}