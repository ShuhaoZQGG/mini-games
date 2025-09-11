'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Shuffle, Timer } from 'lucide-react'

interface CubeState {
  faces: {
    front: string[][]
    back: string[][]
    left: string[][]
    right: string[][]
    top: string[][]
    bottom: string[][]
  }
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  cube: CubeState
  moves: number
  timeElapsed: number
  targetMoves: number
  scrambleMoves: number
}

const COLORS = {
  W: '#FFFFFF', // White
  Y: '#FFFF00', // Yellow
  R: '#FF0000', // Red
  O: '#FFA500', // Orange
  G: '#00FF00', // Green
  B: '#0000FF'  // Blue
}

export default function RubiksCube() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    cube: {
      faces: {
        front: [['R', 'R', 'R'], ['R', 'R', 'R'], ['R', 'R', 'R']],
        back: [['O', 'O', 'O'], ['O', 'O', 'O'], ['O', 'O', 'O']],
        left: [['G', 'G', 'G'], ['G', 'G', 'G'], ['G', 'G', 'G']],
        right: [['B', 'B', 'B'], ['B', 'B', 'B'], ['B', 'B', 'B']],
        top: [['W', 'W', 'W'], ['W', 'W', 'W'], ['W', 'W', 'W']],
        bottom: [['Y', 'Y', 'Y'], ['Y', 'Y', 'Y'], ['Y', 'Y', 'Y']]
      }
    },
    moves: 0,
    timeElapsed: 0,
    targetMoves: 30,
    scrambleMoves: 10
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const rotateFace = (face: string[][]): string[][] => {
    const n = face.length
    const rotated = Array(n).fill(null).map(() => Array(n).fill(''))
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rotated[j][n - 1 - i] = face[i][j]
      }
    }
    
    return rotated
  }

  const rotateFront = (clockwise: boolean = true) => {
    setGameState(prev => {
      const cube = JSON.parse(JSON.stringify(prev.cube))
      
      // Rotate face
      cube.faces.front = clockwise ? 
        rotateFace(cube.faces.front) : 
        rotateFace(rotateFace(rotateFace(cube.faces.front)))
      
      // Move edge pieces
      if (clockwise) {
        const temp = [...cube.faces.top[2]]
        cube.faces.top[2] = [cube.faces.left[2][2], cube.faces.left[1][2], cube.faces.left[0][2]]
        cube.faces.left[0][2] = cube.faces.bottom[0][0]
        cube.faces.left[1][2] = cube.faces.bottom[0][1]
        cube.faces.left[2][2] = cube.faces.bottom[0][2]
        cube.faces.bottom[0] = [cube.faces.right[2][0], cube.faces.right[1][0], cube.faces.right[0][0]]
        cube.faces.right[0][0] = temp[0]
        cube.faces.right[1][0] = temp[1]
        cube.faces.right[2][0] = temp[2]
      }
      
      return {
        ...prev,
        cube,
        moves: prev.moves + 1
      }
    })
  }

  const rotateTop = (clockwise: boolean = true) => {
    setGameState(prev => {
      const cube = JSON.parse(JSON.stringify(prev.cube))
      
      // Rotate face
      cube.faces.top = clockwise ? 
        rotateFace(cube.faces.top) : 
        rotateFace(rotateFace(rotateFace(cube.faces.top)))
      
      // Move edge pieces
      if (clockwise) {
        const temp = [...cube.faces.front[0]]
        cube.faces.front[0] = cube.faces.right[0]
        cube.faces.right[0] = cube.faces.back[0]
        cube.faces.back[0] = cube.faces.left[0]
        cube.faces.left[0] = temp
      }
      
      return {
        ...prev,
        cube,
        moves: prev.moves + 1
      }
    })
  }

  const rotateRight = (clockwise: boolean = true) => {
    setGameState(prev => {
      const cube = JSON.parse(JSON.stringify(prev.cube))
      
      // Rotate face
      cube.faces.right = clockwise ? 
        rotateFace(cube.faces.right) : 
        rotateFace(rotateFace(rotateFace(cube.faces.right)))
      
      // Move edge pieces (simplified)
      if (clockwise) {
        const temp = [cube.faces.front[0][2], cube.faces.front[1][2], cube.faces.front[2][2]]
        cube.faces.front[0][2] = cube.faces.bottom[0][2]
        cube.faces.front[1][2] = cube.faces.bottom[1][2]
        cube.faces.front[2][2] = cube.faces.bottom[2][2]
        cube.faces.bottom[0][2] = cube.faces.back[2][0]
        cube.faces.bottom[1][2] = cube.faces.back[1][0]
        cube.faces.bottom[2][2] = cube.faces.back[0][0]
        cube.faces.back[0][0] = cube.faces.top[2][2]
        cube.faces.back[1][0] = cube.faces.top[1][2]
        cube.faces.back[2][0] = cube.faces.top[0][2]
        cube.faces.top[0][2] = temp[0]
        cube.faces.top[1][2] = temp[1]
        cube.faces.top[2][2] = temp[2]
      }
      
      return {
        ...prev,
        cube,
        moves: prev.moves + 1
      }
    })
  }

  const scrambleCube = () => {
    const moves = ['F', "F'", 'B', "B'", 'U', "U'", 'D', "D'", 'L', "L'", 'R', "R'"]
    const scrambleCount = 10 + gameState.level * 2
    
    for (let i = 0; i < scrambleCount; i++) {
      const move = moves[Math.floor(Math.random() * moves.length)]
      
      setTimeout(() => {
        switch(move) {
          case 'F': rotateFront(true); break
          case "F'": rotateFront(false); break
          case 'U': rotateTop(true); break
          case "U'": rotateTop(false); break
          case 'R': rotateRight(true); break
          case "R'": rotateRight(false); break
          // Add other moves as needed
        }
      }, i * 100)
    }
  }

  const checkSolved = (): boolean => {
    const { faces } = gameState.cube
    
    for (const face of Object.values(faces)) {
      const color = face[0][0]
      for (const row of face) {
        for (const cell of row) {
          if (cell !== color) return false
        }
      }
    }
    
    return true
  }

  const startGame = () => {
    // Reset to solved state
    const solvedCube: CubeState = {
      faces: {
        front: [['R', 'R', 'R'], ['R', 'R', 'R'], ['R', 'R', 'R']],
        back: [['O', 'O', 'O'], ['O', 'O', 'O'], ['O', 'O', 'O']],
        left: [['G', 'G', 'G'], ['G', 'G', 'G'], ['G', 'G', 'G']],
        right: [['B', 'B', 'B'], ['B', 'B', 'B'], ['B', 'B', 'B']],
        top: [['W', 'W', 'W'], ['W', 'W', 'W'], ['W', 'W', 'W']],
        bottom: [['Y', 'Y', 'Y'], ['Y', 'Y', 'Y'], ['Y', 'Y', 'Y']]
      }
    }

    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      cube: solvedCube,
      moves: 0,
      timeElapsed: 0,
      targetMoves: 30,
      scrambleMoves: 10
    })

    // Scramble after a delay
    setTimeout(() => scrambleCube(), 500)
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

  // Timer
  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 1
        }))
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState.gameStatus])

  // Check for solved state
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.moves > 0) {
      if (checkSolved()) {
        const score = Math.max(0, 1000 - gameState.moves * 10 - gameState.timeElapsed)
        setGameState(prev => ({
          ...prev,
          gameStatus: 'victory',
          score
        }))
      }
    }
  }, [gameState.cube, gameState.moves])

  // Save to localStorage
  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('rubiksCube_score', gameState.score.toString())
      localStorage.setItem('rubiksCube_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderFace = (face: string[][], label: string) => (
    <div className="text-center">
      <div className="text-xs font-semibold mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-0.5 bg-black p-1 rounded">
        {face.map((row, i) =>
          row.map((color, j) => (
            <div
              key={`${i}-${j}`}
              className="w-8 h-8 rounded"
              style={{ backgroundColor: COLORS[color as keyof typeof COLORS] }}
            />
          ))
        )}
      </div>
    </div>
  )

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Gamepad2 className="w-8 h-8" />
              Rubik's Cube
            </h1>
            <p className="text-muted-foreground">3D cube solver with timer!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Rotate faces to match colors</li>
              <li>• Each face should be a single color</li>
              <li>• Complete in minimum moves</li>
              <li>• Beat the timer for bonus points</li>
              <li>• Use keyboard shortcuts for speed</li>
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
                Cube Solved!
              </>
            ) : (
              'Time's Up!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Score: {gameState.score}</p>
            <p className="text-lg text-muted-foreground">Moves: {gameState.moves}</p>
            <p className="text-lg text-muted-foreground">Time: {formatTime(gameState.timeElapsed)}</p>
            <p className="text-lg text-muted-foreground">Level: {gameState.level}</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Moves: {gameState.moves}</span>
            <span className="text-lg font-semibold flex items-center gap-1">
              <Timer className="w-4 h-4" />
              {formatTime(gameState.timeElapsed)}
            </span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={scrambleCube}>
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={toggleSound}>
              {gameState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={togglePause}>
              {gameState.gameStatus === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Cube Display */}
        <div className="flex justify-center">
          <div className="space-y-4">
            {/* Top face */}
            <div className="flex justify-center">
              {renderFace(gameState.cube.faces.top, 'Top')}
            </div>
            
            {/* Middle row - Left, Front, Right, Back */}
            <div className="flex justify-center gap-4">
              {renderFace(gameState.cube.faces.left, 'Left')}
              {renderFace(gameState.cube.faces.front, 'Front')}
              {renderFace(gameState.cube.faces.right, 'Right')}
              {renderFace(gameState.cube.faces.back, 'Back')}
            </div>
            
            {/* Bottom face */}
            <div className="flex justify-center">
              {renderFace(gameState.cube.faces.bottom, 'Bottom')}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Rotation Controls</h3>
            <div className="flex justify-center gap-2">
              <Button onClick={() => rotateFront(true)} size="sm">F</Button>
              <Button onClick={() => rotateFront(false)} size="sm">F'</Button>
              <Button onClick={() => rotateTop(true)} size="sm">U</Button>
              <Button onClick={() => rotateTop(false)} size="sm">U'</Button>
              <Button onClick={() => rotateRight(true)} size="sm">R</Button>
              <Button onClick={() => rotateRight(false)} size="sm">R'</Button>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>F = Front, U = Up, R = Right | ' = Counter-clockwise</p>
            <p>Target: Solve in under {gameState.targetMoves} moves</p>
          </div>
        </div>
      </div>
    </Card>
  )
}