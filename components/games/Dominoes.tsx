'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy } from 'lucide-react'

type Domino = {
  id: number
  left: number
  right: number
  played: boolean
  owner: 'player' | 'ai' | null
}

const Dominoes: React.FC = () => {
  const [tiles, setTiles] = useState<Domino[]>([])
  const [board, setBoard] = useState<Domino[]>([])
  const [playerTiles, setPlayerTiles] = useState<Domino[]>([])
  const [aiTiles, setAiTiles] = useState<Domino[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>('player')
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [leftEnd, setLeftEnd] = useState<number | null>(null)
  const [rightEnd, setRightEnd] = useState<number | null>(null)
  
  const initGame = useCallback(() => {
    const newTiles: Domino[] = []
    let id = 0
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        newTiles.push({id: id++, left: i, right: j, played: false, owner: null})
      }
    }
    
    // Shuffle and deal
    const shuffled = [...newTiles].sort(() => Math.random() - 0.5)
    const playerHand = shuffled.slice(0, 7).map(t => ({...t, owner: 'player' as const}))
    const aiHand = shuffled.slice(7, 14).map(t => ({...t, owner: 'ai' as const}))
    
    setTiles(shuffled)
    setPlayerTiles(playerHand)
    setAiTiles(aiHand)
    setBoard([])
    setLeftEnd(null)
    setRightEnd(null)
    setGameOver(false)
    setCurrentPlayer('player')
  }, [])
  
  const canPlay = useCallback((tile: Domino): boolean => {
    if (board.length === 0) return true
    return tile.left === leftEnd || tile.right === leftEnd || 
           tile.left === rightEnd || tile.right === rightEnd
  }, [board, leftEnd, rightEnd])
  
  const playTile = useCallback((tile: Domino, side: 'left' | 'right') => {
    if (!canPlay(tile)) return false
    
    const newBoard = [...board]
    let newLeftEnd = leftEnd
    let newRightEnd = rightEnd
    
    if (board.length === 0) {
      newBoard.push(tile)
      newLeftEnd = tile.left
      newRightEnd = tile.right
    } else if (side === 'left') {
      if (tile.right === leftEnd) {
        newBoard.unshift(tile)
        newLeftEnd = tile.left
      } else if (tile.left === leftEnd) {
        newBoard.unshift({...tile, left: tile.right, right: tile.left})
        newLeftEnd = tile.right
      }
    } else {
      if (tile.left === rightEnd) {
        newBoard.push(tile)
        newRightEnd = tile.right
      } else if (tile.right === rightEnd) {
        newBoard.push({...tile, left: tile.right, right: tile.left})
        newRightEnd = tile.left
      }
    }
    
    setBoard(newBoard)
    setLeftEnd(newLeftEnd)
    setRightEnd(newRightEnd)
    
    if (currentPlayer === 'player') {
      setPlayerTiles(prev => prev.filter(t => t.id !== tile.id))
      if (playerTiles.length === 1) {
        setGameOver(true)
        setPlayerScore(prev => prev + 100)
      }
    } else {
      setAiTiles(prev => prev.filter(t => t.id !== tile.id))
      if (aiTiles.length === 1) {
        setGameOver(true)
        setAiScore(prev => prev + 100)
      }
    }
    
    setCurrentPlayer(currentPlayer === 'player' ? 'ai' : 'player')
    return true
  }, [board, leftEnd, rightEnd, currentPlayer, playerTiles, aiTiles])
  
  const aiPlay = useCallback(() => {
    const playableTiles = aiTiles.filter(canPlay)
    if (playableTiles.length > 0) {
      const tile = playableTiles[0]
      const side = Math.random() > 0.5 ? 'left' : 'right'
      setTimeout(() => playTile(tile, side), 1000)
    } else {
      setCurrentPlayer('player')
    }
  }, [aiTiles, canPlay, playTile])
  
  useEffect(() => {
    if (currentPlayer === 'ai' && !gameOver) {
      aiPlay()
    }
  }, [currentPlayer, gameOver, aiPlay])
  
  useEffect(() => {
    initGame()
  }, [initGame])
  
  const renderDomino = (tile: Domino) => (
    <div className="inline-flex border-2 border-black rounded bg-white p-1">
      <div className="w-8 h-8 border-r border-black flex items-center justify-center font-bold">
        {tile.left}
      </div>
      <div className="w-8 h-8 flex items-center justify-center font-bold">
        {tile.right}
      </div>
    </div>
  )
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Dominoes</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <span>You: {playerScore}</span>
            <span>AI: {aiScore}</span>
            <span>Tiles: {playerTiles.length}</span>
          </div>
          <Button onClick={initGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* AI Hand (hidden) */}
          <div className="flex gap-2 justify-center">
            {aiTiles.map(() => (
              <div key={Math.random()} className="w-20 h-12 bg-gray-400 rounded" />
            ))}
          </div>
          
          {/* Board */}
          <div className="min-h-[200px] bg-green-100 dark:bg-green-900/30 rounded-lg p-4 flex items-center justify-center flex-wrap gap-2">
            {board.length === 0 ? (
              <div className="text-gray-500">Play a tile to start</div>
            ) : (
              board.map((tile, i) => (
                <div key={tile.id}>{renderDomino(tile)}</div>
              ))
            )}
          </div>
          
          {/* Player Hand */}
          <div className="flex gap-2 justify-center flex-wrap">
            {playerTiles.map(tile => (
              <Button
                key={tile.id}
                variant={canPlay(tile) ? "default" : "outline"}
                disabled={currentPlayer !== 'player' || !canPlay(tile)}
                onClick={() => playTile(tile, board.length === 0 || tile.left === leftEnd || tile.right === leftEnd ? 'left' : 'right')}
                className="p-1"
              >
                {renderDomino(tile)}
              </Button>
            ))}
          </div>
          
          {currentPlayer === 'ai' && (
            <div className="text-center text-gray-500">AI is thinking...</div>
          )}
          
          {gameOver && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                {playerTiles.length === 0 ? 'You Win!' : 'AI Wins!'}
              </h2>
              <Button onClick={initGame}>Play Again</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Dominoes
