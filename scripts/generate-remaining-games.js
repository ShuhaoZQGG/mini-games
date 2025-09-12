const fs = require('fs');
const path = require('path');

// Template for game component
const generateGameComponent = (gameName, gameTitle, gameDescription, gameType) => {
  const componentName = gameName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
  
  return `'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Trophy, Gamepad2 } from 'lucide-react'

export default function ${componentName}() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [stars, setStars] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('${gameName}HighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('${gameName}HighScore', score.toString())
    }
  }, [score, highScore])

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff)
    setGameState('playing')
    setLevel(1)
    setScore(0)
  }

  const completeLevel = () => {
    const earnedStars = Math.floor(Math.random() * 3) + 1 // Placeholder logic
    setStars(earnedStars)
    setGameState('levelComplete')
  }

  const nextLevel = () => {
    setLevel(prev => prev + 1)
    setGameState('playing')
  }

  const resetGame = () => {
    setGameState('menu')
    setLevel(1)
    setScore(0)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            ${gameTitle}
          </span>
          <span className="text-sm font-normal">High Score: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">${gameTitle}</h2>
              <p className="text-gray-600">${gameDescription}</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Select Difficulty</h3>
              <div className="grid grid-cols-3 gap-4">
                <Button onClick={() => startGame('easy')} variant="outline">
                  Easy
                </Button>
                <Button onClick={() => startGame('medium')} variant="outline">
                  Medium
                </Button>
                <Button onClick={() => startGame('hard')} variant="outline">
                  Hard
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span>Level: {level}</span>
              <span>Score: {score}</span>
            </div>
            
            <div className="text-center space-y-4">
              <h3 className="text-xl">Game content goes here</h3>
              <p>This is a placeholder for ${gameTitle} gameplay</p>
              <Button onClick={completeLevel}>Complete Level (Test)</Button>
            </div>
          </div>
        )}

        {gameState === 'levelComplete' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Level {level} Complete!</h2>
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={\`w-12 h-12 \${
                    star <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }\`}
                />
              ))}
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={nextLevel}>Next Level</Button>
              <Button onClick={resetGame} variant="outline">Main Menu</Button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Game Over</h2>
            <p className="text-2xl font-bold">Final Score: {score}</p>
            <Button onClick={resetGame}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}`;
};

// Template for page file
const generatePageFile = (gameName, gameTitle, gameDescription) => {
  const componentName = gameName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
  
  return `import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const ${componentName} = dynamic(() => import('@/components/games/${gameName}'), { ssr: false })

export const metadata: Metadata = {
  title: '${gameTitle} | Mini Games Platform',
  description: 'Play ${gameTitle} - ${gameDescription}'
}

export default function ${componentName}Page() {
  return <${componentName} />
}`;
};

// Games to generate
const games = [
  // Remaining educational
  { name: 'science-trivia', title: 'Science Trivia', description: 'STEM knowledge quiz with categories', type: 'educational' },
  
  // Sports games
  { name: 'basketball-shootout', title: 'Basketball Shootout', description: 'Free throw accuracy with physics simulation', type: 'sports' },
  { name: 'soccer-penalty', title: 'Soccer Penalty', description: 'Penalty kick with goalkeeper AI', type: 'sports' },
  { name: 'baseball-homerun', title: 'Baseball Homerun', description: 'Batting practice derby with timing mechanics', type: 'sports' },
  { name: 'golf-putting', title: 'Golf Putting', description: 'Mini putting with wind and slope physics', type: 'sports' },
  { name: 'tennis-rally', title: 'Tennis Rally', description: 'Volley survival with increasing speed', type: 'sports' },
  { name: 'boxing-match', title: 'Boxing Match', description: 'Timing-based combat with combos', type: 'sports' },
  
  // Arcade classics
  { name: 'centipede', title: 'Centipede', description: 'Mushroom field shooter with segments', type: 'arcade' },
  { name: 'frogger', title: 'Frogger', description: 'Traffic crossing with multiple lanes', type: 'arcade' },
  { name: 'galaga', title: 'Galaga', description: 'Formation space shooter with patterns', type: 'arcade' },
  { name: 'dig-dug', title: 'Dig Dug', description: 'Underground monster hunter with inflation mechanic', type: 'arcade' },
  { name: 'qbert', title: 'Q*bert', description: 'Isometric pyramid hopper with color changes', type: 'arcade' },
  { name: 'defender', title: 'Defender', description: 'Horizontal space defender with rescue missions', type: 'arcade' },
  
  // Board games
  { name: 'chess-puzzles', title: 'Chess Puzzles', description: 'Daily tactical challenges with mate-in-X', type: 'board' },
  { name: 'shogi', title: 'Shogi', description: 'Japanese chess variant with drops', type: 'board' },
  { name: 'xiangqi', title: 'Xiangqi', description: 'Chinese chess with river and palace', type: 'board' },
  { name: 'othello-advanced', title: 'Othello Advanced', description: 'Enhanced reversi with AI strategies', type: 'board' },
  { name: 'mancala', title: 'Mancala', description: 'Ancient counting game with capture rules', type: 'board' },
  { name: 'nine-mens-morris', title: 'Nine Men\'s Morris', description: 'Mill formation strategy game', type: 'board' },
];

// Generate files
games.forEach(game => {
  // Create component
  const componentPath = path.join(__dirname, '..', 'components', 'games', `${game.name}.tsx`);
  const componentContent = generateGameComponent(game.name, game.title, game.description, game.type);
  
  // Create page directory
  const pageDir = path.join(__dirname, '..', 'app', 'games', game.name);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  // Create page file
  const pagePath = path.join(pageDir, 'page.tsx');
  const pageContent = generatePageFile(game.name, game.title, game.description);
  
  // Write files
  fs.writeFileSync(componentPath, componentContent);
  fs.writeFileSync(pagePath, pageContent);
  
  console.log(`Created: ${game.name}`);
});

console.log('All games generated successfully!');