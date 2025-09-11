#!/bin/bash

# Function to create a game file
create_game() {
  local path=$1
  local name=$2
  local icon=$3
  local description=$4
  
  cat > "$path" << GAME_EOF
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Home, RotateCcw, Play, Pause, $icon } from 'lucide-react'

export default function $name() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  const startGame = () => {
    setScore(0)
    setLevel(1)
    setLives(3)
    setGameState('playing')
  }

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return
    
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, 800, 600)

    // Game logic here
    ctx.fillStyle = '#fff'
    ctx.font = '20px monospace'
    ctx.fillText(\`Score: \${score}\`, 20, 30)
    ctx.fillText(\`Level: \${level}\`, 20, 60)
    ctx.fillText(\`Lives: \${lives}\`, 20, 90)

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, score, level, lives])

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, gameLoop])

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <$icon className="w-8 h-8" />
          $name
        </h2>
        <Button onClick={() => setGameState('menu')} size="sm" variant="outline">
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {gameState === 'menu' && (
        <div className="flex flex-col items-center justify-center h-[600px] gap-4">
          <$icon className="w-24 h-24 text-primary" />
          <h3 className="text-3xl font-bold">$name</h3>
          <p className="text-muted-foreground text-center max-w-md">
            $description
          </p>
          <Button onClick={startGame} size="lg">
            <Play className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border rounded-lg"
        />
      )}

      {gameState === 'gameOver' && (
        <div className="flex flex-col items-center justify-center h-[600px] gap-4">
          <h3 className="text-2xl font-bold">Game Over!</h3>
          <p className="text-xl">Final Score: {score}</p>
          <p>Level Reached: {level}</p>
          <Button onClick={startGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      )}
    </Card>
  )
}
GAME_EOF
}

# Create remaining puzzle games
create_game "/Users/shuhaozhang/Project/mini-games/components/games/puzzle/Hashi.tsx" \
  "Hashi" "GitBranch" "Connect islands with bridges following the rules"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/puzzle/Slitherlink.tsx" \
  "Slitherlink" "Circle" "Draw a single loop that satisfies all number clues"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/puzzle/Nurikabe.tsx" \
  "Nurikabe" "Grid3x3" "Create islands and seas following the number clues"

# Create action games
create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/SubwayRunner.tsx" \
  "SubwayRunner" "Train" "Endless runner - dodge obstacles and collect coins"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/FruitSlice.tsx" \
  "FruitSlice" "Cherry" "Slice flying fruits and avoid bombs"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/TowerClimb.tsx" \
  "TowerClimb" "TrendingUp" "Climb the tower before platforms crumble"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/LaserQuest.tsx" \
  "LaserQuest" "Zap" "Redirect lasers with mirrors to hit targets"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/NinjaRun.tsx" \
  "NinjaRun" "UserCheck" "Side-scrolling parkour with wall jumps"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/SpaceFighter.tsx" \
  "SpaceFighter" "Rocket" "Vertical scrolling space shooter"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/BallJump.tsx" \
  "BallJump" "Circle" "Bouncing ball platformer"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/SpeedBoat.tsx" \
  "SpeedBoat" "Anchor" "Water racing with obstacles"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/ArrowMaster.tsx" \
  "ArrowMaster" "Target" "Archery with wind effects"

create_game "/Users/shuhaozhang/Project/mini-games/components/games/action/BoxingChampion.tsx" \
  "BoxingChampion" "Swords" "Timing-based boxing game"

echo "All games created successfully!"
