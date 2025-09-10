'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Bot, Anchor, Target, Zap, Star, RotateCw, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
type Direction = 'horizontal' | 'vertical'
type Difficulty = 'Easy' | 'Medium' | 'Hard'
type GamePhase = 'placement' | 'battle' | 'gameover'

interface Ship {
  id: number
  name: string
  size: number
  positions: { row: number; col: number }[]
  hits: number
  sunk: boolean
}

interface Board {
  grid: CellState[][]
  ships: Ship[]
}

const GRID_SIZE = 10
const SHIPS = [
  { id: 1, name: 'Carrier', size: 5 },
  { id: 2, name: 'Battleship', size: 4 },
  { id: 3, name: 'Cruiser', size: 3 },
  { id: 4, name: 'Submarine', size: 3 },
  { id: 5, name: 'Destroyer', size: 2 }
]

const createEmptyBoard = (): Board => ({
  grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty')),
  ships: []
})

const Battleship: React.FC = () => {
  const [playerBoard, setPlayerBoard] = useState<Board>(createEmptyBoard())
  const [aiBoard, setAiBoard] = useState<Board>(createEmptyBoard())
  const [playerShots, setPlayerShots] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  )
  const [aiShots, setAiShots] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  )
  const [phase, setPhase] = useState<GamePhase>('placement')
  const [currentShipIndex, setCurrentShipIndex] = useState(0)
  const [placementDirection, setPlacementDirection] = useState<Direction>('horizontal')
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>('player')
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [lastAIHit, setLastAIHit] = useState<{ row: number; col: number } | null>(null)
  const [aiTargetMode, setAiTargetMode] = useState(false)
  const [message, setMessage] = useState('Place your ships on the board')
  const [turnCount, setTurnCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('battleship-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  const resetGame = useCallback(() => {
    setPlayerBoard(createEmptyBoard())
    setAiBoard(createEmptyBoard())
    setPlayerShots(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)))
    setAiShots(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)))
    setPhase('placement')
    setCurrentShipIndex(0)
    setCurrentPlayer('player')
    setWinner(null)
    setLastAIHit(null)
    setAiTargetMode(false)
    setMessage('Place your ships on the board')
    setTurnCount(0)
    setScore(0)
  }, [])

  const canPlaceShip = (board: Board, ship: typeof SHIPS[0], row: number, col: number, direction: Direction): boolean => {
    const positions: { row: number; col: number }[] = []
    
    for (let i = 0; i < ship.size; i++) {
      const r = direction === 'horizontal' ? row : row + i
      const c = direction === 'horizontal' ? col + i : col
      
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false
      
      // Check if cell is occupied
      if (board.grid[r][c] === 'ship') return false
      
      // Check adjacent cells (ships can't touch)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const checkR = r + dr
          const checkC = c + dc
          if (checkR >= 0 && checkR < GRID_SIZE && checkC >= 0 && checkC < GRID_SIZE) {
            if (board.grid[checkR][checkC] === 'ship') return false
          }
        }
      }
      
      positions.push({ row: r, col: c })
    }
    
    return true
  }

  const placeShip = (board: Board, ship: typeof SHIPS[0], row: number, col: number, direction: Direction): Board => {
    const newBoard = {
      grid: board.grid.map(row => [...row]),
      ships: [...board.ships]
    }
    
    const positions: { row: number; col: number }[] = []
    
    for (let i = 0; i < ship.size; i++) {
      const r = direction === 'horizontal' ? row : row + i
      const c = direction === 'horizontal' ? col + i : col
      newBoard.grid[r][c] = 'ship'
      positions.push({ row: r, col: c })
    }
    
    newBoard.ships.push({
      ...ship,
      positions,
      hits: 0,
      sunk: false
    })
    
    return newBoard
  }

  const placeAIShips = useCallback(() => {
    let board = createEmptyBoard()
    
    for (const ship of SHIPS) {
      let placed = false
      let attempts = 0
      
      while (!placed && attempts < 100) {
        const row = Math.floor(Math.random() * GRID_SIZE)
        const col = Math.floor(Math.random() * GRID_SIZE)
        const direction: Direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'
        
        if (canPlaceShip(board, ship, row, col, direction)) {
          board = placeShip(board, ship, row, col, direction)
          placed = true
        }
        attempts++
      }
    }
    
    setAiBoard(board)
  }, [])

  const handleCellClick = (row: number, col: number, isPlayerBoard: boolean) => {
    if (phase === 'placement' && isPlayerBoard) {
      if (currentShipIndex < SHIPS.length) {
        const ship = SHIPS[currentShipIndex]
        if (canPlaceShip(playerBoard, ship, row, col, placementDirection)) {
          const newBoard = placeShip(playerBoard, ship, row, col, placementDirection)
          setPlayerBoard(newBoard)
          setCurrentShipIndex(prev => prev + 1)
          
          if (currentShipIndex === SHIPS.length - 1) {
            setPhase('battle')
            placeAIShips()
            setMessage('Battle phase! Click on the enemy board to fire!')
          } else {
            setMessage(`Place your ${SHIPS[currentShipIndex + 1].name} (${SHIPS[currentShipIndex + 1].size} cells)`)
          }
        }
      }
    } else if (phase === 'battle' && !isPlayerBoard && currentPlayer === 'player') {
      // Player shooting at AI board
      if (!playerShots[row][col]) {
        const newShots = playerShots.map(row => [...row])
        newShots[row][col] = true
        setPlayerShots(newShots)
        
        const isHit = aiBoard.grid[row][col] === 'ship'
        let newAiBoard = { ...aiBoard, grid: aiBoard.grid.map(row => [...row]) }
        
        if (isHit) {
          newAiBoard.grid[row][col] = 'hit'
          setMessage('Hit!')
          setScore(prev => prev + 100)
          
          // Check if ship is sunk
          const hitShip = aiBoard.ships.find(ship => 
            ship.positions.some(pos => pos.row === row && pos.col === col)
          )
          
          if (hitShip) {
            hitShip.hits++
            if (hitShip.hits === hitShip.size) {
              hitShip.sunk = true
              setMessage(`You sunk the enemy ${hitShip.name}!`)
              setScore(prev => prev + 500)
              
              // Mark all ship cells as sunk
              hitShip.positions.forEach(pos => {
                newAiBoard.grid[pos.row][pos.col] = 'sunk'
              })
              
              // Check for win
              if (aiBoard.ships.every(ship => ship.sunk || ship === hitShip)) {
                setWinner('player')
                setPhase('gameover')
              }
            }
          }
        } else {
          newAiBoard.grid[row][col] = 'miss'
          setMessage('Miss!')
        }
        
        setAiBoard(newAiBoard)
        setTurnCount(prev => prev + 1)
        
        if (phase === 'battle') {
          setCurrentPlayer('ai')
          setTimeout(() => handleAITurn(), 1000)
        }
      }
    }
  }

  const handleAITurn = useCallback(() => {
    if (currentPlayer !== 'ai' || phase !== 'battle') return
    
    let row: number, col: number
    let attempts = 0
    
    // AI strategy based on difficulty
    if (difficulty === 'Hard' && lastAIHit && aiTargetMode) {
      // Smart targeting mode - look for adjacent cells
      const adjacentCells = [
        { row: lastAIHit.row - 1, col: lastAIHit.col },
        { row: lastAIHit.row + 1, col: lastAIHit.col },
        { row: lastAIHit.row, col: lastAIHit.col - 1 },
        { row: lastAIHit.row, col: lastAIHit.col + 1 }
      ].filter(cell => 
        cell.row >= 0 && cell.row < GRID_SIZE &&
        cell.col >= 0 && cell.col < GRID_SIZE &&
        !aiShots[cell.row][cell.col]
      )
      
      if (adjacentCells.length > 0) {
        const target = adjacentCells[Math.floor(Math.random() * adjacentCells.length)]
        row = target.row
        col = target.col
      } else {
        setAiTargetMode(false)
        setLastAIHit(null)
        do {
          row = Math.floor(Math.random() * GRID_SIZE)
          col = Math.floor(Math.random() * GRID_SIZE)
          attempts++
        } while (aiShots[row][col] && attempts < 100)
      }
    } else if (difficulty === 'Medium' && Math.random() < 0.3) {
      // Medium difficulty - sometimes targets ships
      const shipCells = []
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (playerBoard.grid[r][c] === 'ship' && !aiShots[r][c]) {
            shipCells.push({ row: r, col: c })
          }
        }
      }
      
      if (shipCells.length > 0) {
        const target = shipCells[Math.floor(Math.random() * shipCells.length)]
        row = target.row
        col = target.col
      } else {
        do {
          row = Math.floor(Math.random() * GRID_SIZE)
          col = Math.floor(Math.random() * GRID_SIZE)
          attempts++
        } while (aiShots[row][col] && attempts < 100)
      }
    } else {
      // Random shooting
      do {
        row = Math.floor(Math.random() * GRID_SIZE)
        col = Math.floor(Math.random() * GRID_SIZE)
        attempts++
      } while (aiShots[row][col] && attempts < 100)
    }
    
    if (attempts >= 100) {
      setCurrentPlayer('player')
      return
    }
    
    const newShots = aiShots.map(row => [...row])
    newShots[row][col] = true
    setAiShots(newShots)
    
    const isHit = playerBoard.grid[row][col] === 'ship'
    let newPlayerBoard = { ...playerBoard, grid: playerBoard.grid.map(row => [...row]) }
    
    if (isHit) {
      newPlayerBoard.grid[row][col] = 'hit'
      setMessage('Enemy hit your ship!')
      
      if (difficulty === 'Hard') {
        setLastAIHit({ row, col })
        setAiTargetMode(true)
      }
      
      // Check if ship is sunk
      const hitShip = playerBoard.ships.find(ship => 
        ship.positions.some(pos => pos.row === row && pos.col === col)
      )
      
      if (hitShip) {
        hitShip.hits++
        if (hitShip.hits === hitShip.size) {
          hitShip.sunk = true
          setMessage(`Enemy sunk your ${hitShip.name}!`)
          setAiTargetMode(false)
          setLastAIHit(null)
          
          // Mark all ship cells as sunk
          hitShip.positions.forEach(pos => {
            newPlayerBoard.grid[pos.row][pos.col] = 'sunk'
          })
          
          // Check for win
          if (playerBoard.ships.every(ship => ship.sunk || ship === hitShip)) {
            setWinner('ai')
            setPhase('gameover')
          }
        }
      }
    } else {
      newPlayerBoard.grid[row][col] = 'miss'
      setMessage('Enemy missed!')
      if (difficulty === 'Hard' && aiTargetMode && !isHit) {
        // If we miss in target mode, maybe we were going in wrong direction
        if (Math.random() < 0.5) {
          setAiTargetMode(false)
          setLastAIHit(null)
        }
      }
    }
    
    setPlayerBoard(newPlayerBoard)
    setCurrentPlayer('player')
  }, [currentPlayer, phase, aiShots, playerBoard, lastAIHit, aiTargetMode, difficulty])

  const renderCell = (row: number, col: number, board: Board, shots: boolean[][], isPlayerBoard: boolean) => {
    const cellState = board.grid[row][col]
    const isShot = shots[row][col]
    const isHovered = hoveredCell?.row === row && hoveredCell?.col === col
    
    // Preview ship placement
    let isPreview = false
    if (phase === 'placement' && isPlayerBoard && currentShipIndex < SHIPS.length && isHovered) {
      const ship = SHIPS[currentShipIndex]
      for (let i = 0; i < ship.size; i++) {
        const r = placementDirection === 'horizontal' ? row : row + i
        const c = placementDirection === 'horizontal' ? col + i : col
        if (r === row && c === col) {
          isPreview = canPlaceShip(playerBoard, ship, row, col, placementDirection)
          break
        }
      }
    }
    
    return (
      <div
        key={`${row}-${col}`}
        className={cn(
          "w-8 h-8 border border-gray-400 cursor-pointer transition-all",
          cellState === 'empty' && !isShot && "bg-blue-100 hover:bg-blue-200",
          cellState === 'empty' && isShot && "bg-gray-200",
          cellState === 'ship' && !isShot && isPlayerBoard && "bg-gray-500",
          cellState === 'ship' && !isShot && !isPlayerBoard && "bg-blue-100 hover:bg-blue-200",
          cellState === 'hit' && "bg-red-500",
          cellState === 'miss' && "bg-blue-300",
          cellState === 'sunk' && "bg-red-800",
          isPreview && "bg-green-300",
          phase === 'battle' && !isPlayerBoard && !isShot && "hover:bg-yellow-200"
        )}
        onClick={() => handleCellClick(row, col, isPlayerBoard)}
        onMouseEnter={() => setHoveredCell({ row, col })}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {cellState === 'hit' && (
          <div className="w-full h-full flex items-center justify-center text-white font-bold">
            X
          </div>
        )}
        {cellState === 'miss' && (
          <div className="w-full h-full flex items-center justify-center text-white">
            •
          </div>
        )}
      </div>
    )
  }

  const calculateStars = () => {
    if (winner !== 'player') return 0
    const accuracy = score / (turnCount * 100)
    const remainingShips = playerBoard.ships.filter(ship => !ship.sunk).length
    
    if (remainingShips === 5 && accuracy > 0.5) return 3
    if (remainingShips >= 3 && accuracy > 0.3) return 2
    if (remainingShips >= 1) return 1
    return 0
  }

  useEffect(() => {
    if (phase === 'gameover' && winner === 'player') {
      const earnedStars = calculateStars()
      setStars(earnedStars)
      
      const finalScore = score * (difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3)
      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem('battleship-highscore', finalScore.toString())
      }
      
      if (earnedStars === 3) {
        setLevel(prev => prev + 1)
      }
    }
  }, [phase, winner, score, difficulty, highScore])

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="w-6 h-6" />
            Battleship
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span>High Score: {highScore}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>Level {level}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={difficulty === 'Easy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('Easy')}
              disabled={phase !== 'placement' || currentShipIndex > 0}
            >
              Easy
            </Button>
            <Button
              variant={difficulty === 'Medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('Medium')}
              disabled={phase !== 'placement' || currentShipIndex > 0}
            >
              Medium
            </Button>
            <Button
              variant={difficulty === 'Hard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('Hard')}
              disabled={phase !== 'placement' || currentShipIndex > 0}
            >
              Hard
            </Button>
          </div>
          <div className="flex gap-2">
            {phase === 'placement' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlacementDirection(prev => 
                  prev === 'horizontal' ? 'vertical' : 'horizontal'
                )}
                className="flex items-center gap-1"
              >
                <RotateCw className="w-4 h-4" />
                {placementDirection === 'horizontal' ? 'Horizontal' : 'Vertical'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              New Game
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold">{message}</p>
          {phase === 'placement' && currentShipIndex < SHIPS.length && (
            <p className="text-sm text-muted-foreground">
              Placing: {SHIPS[currentShipIndex].name} (Size: {SHIPS[currentShipIndex].size})
            </p>
          )}
          {phase === 'battle' && (
            <p className="text-sm text-muted-foreground">
              {currentPlayer === 'player' ? 'Your turn' : 'Enemy turn'}
            </p>
          )}
        </div>

        <div className="flex justify-around items-start">
          <div className="space-y-2">
            <h3 className="text-center font-semibold">Your Fleet</h3>
            <div className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: GRID_SIZE }).map((_, row) =>
                Array.from({ length: GRID_SIZE }).map((_, col) =>
                  renderCell(row, col, playerBoard, aiShots, true)
                )
              )}
            </div>
            <div className="space-y-1 text-sm">
              {playerBoard.ships.map(ship => (
                <div key={ship.id} className={cn(
                  "flex items-center gap-2",
                  ship.sunk && "line-through text-muted-foreground"
                )}>
                  <Waves className={cn("w-4 h-4", ship.sunk && "text-red-500")} />
                  <span>{ship.name}</span>
                  <span>({ship.hits}/{ship.size})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-center font-semibold">Enemy Fleet</h3>
            <div className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: GRID_SIZE }).map((_, row) =>
                Array.from({ length: GRID_SIZE }).map((_, col) =>
                  renderCell(row, col, aiBoard, playerShots, false)
                )
              )}
            </div>
            <div className="space-y-1 text-sm">
              {aiBoard.ships.map(ship => (
                <div key={ship.id} className={cn(
                  "flex items-center gap-2",
                  ship.sunk && "line-through text-muted-foreground"
                )}>
                  <Target className={cn("w-4 h-4", ship.sunk && "text-green-500")} />
                  <span>{ship.name}</span>
                  {ship.sunk && <span>SUNK</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {phase === 'gameover' && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">
              {winner === 'player' ? 'Victory!' : 'Defeat!'}
            </div>
            <div className="text-lg">
              Final Score: {score}
            </div>
            {winner === 'player' && (
              <div className="flex justify-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-8 h-8",
                      i < stars ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            )}
            <Button onClick={resetGame}>Play Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default Battleship