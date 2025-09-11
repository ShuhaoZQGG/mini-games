'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users, Flag, Bomb, Shield } from 'lucide-react'

interface Piece {
  rank: number
  name: string
  owner: 1 | 2
  revealed: boolean
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory' | 'placement'
  soundEnabled: boolean
  board: (Piece | null)[][]
  currentPlayer: 1 | 2
  selectedPiece: { row: number; col: number } | null
  moveHistory: string[]
}

const BOARD_SIZE = 10
const PIECES = [
  { rank: 0, name: 'Flag', count: 1, icon: Flag },
  { rank: 11, name: 'Bomb', count: 6, icon: Bomb },
  { rank: 1, name: 'Spy', count: 1 },
  { rank: 2, name: 'Scout', count: 8 },
  { rank: 3, name: 'Miner', count: 5 },
  { rank: 4, name: 'Sergeant', count: 4 },
  { rank: 5, name: 'Lieutenant', count: 4 },
  { rank: 6, name: 'Captain', count: 4 },
  { rank: 7, name: 'Major', count: 3 },
  { rank: 8, name: 'Colonel', count: 2 },
  { rank: 9, name: 'General', count: 1 },
  { rank: 10, name: 'Marshal', count: 1 }
]

export default function OnlineStratego() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    currentPlayer: 1,
    selectedPiece: null,
    moveHistory: []
  })

  const [placementPieces, setPlacementPieces] = useState<Piece[]>([])

  const initializePieces = (player: 1 | 2): Piece[] => {
    const pieces: Piece[] = []
    
    PIECES.forEach(pieceType => {
      for (let i = 0; i < pieceType.count; i++) {
        pieces.push({
          rank: pieceType.rank,
          name: pieceType.name,
          owner: player,
          revealed: false
        })
      }
    })
    
    return pieces
  }

  const placeAIPieces = (board: (Piece | null)[][]): (Piece | null)[][] => {
    const aiPieces = initializePieces(2)
    const newBoard = board.map(row => [...row])
    
    // Shuffle AI pieces
    for (let i = aiPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[aiPieces[i], aiPieces[j]] = [aiPieces[j], aiPieces[i]]
    }
    
    // Place on rows 0-3
    let pieceIndex = 0
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (pieceIndex < aiPieces.length) {
          newBoard[row][col] = aiPieces[pieceIndex++]
        }
      }
    }
    
    return newBoard
  }

  const canMove = (from: { row: number; col: number }, to: { row: number; col: number }, piece: Piece): boolean => {
    // Can't move to own piece
    const targetPiece = gameState.board[to.row][to.col]
    if (targetPiece && targetPiece.owner === piece.owner) return false
    
    // Bombs and flags can't move
    if (piece.rank === 0 || piece.rank === 11) return false
    
    // Check movement range
    const dr = Math.abs(to.row - from.row)
    const dc = Math.abs(to.col - from.col)
    
    // Must move in straight line
    if (dr > 0 && dc > 0) return false
    
    // Scouts can move multiple squares
    if (piece.rank === 2) {
      if (dr + dc > 1) {
        // Check path is clear
        const stepR = dr === 0 ? 0 : (to.row - from.row) / dr
        const stepC = dc === 0 ? 0 : (to.col - from.col) / dc
        
        for (let i = 1; i < dr + dc; i++) {
          const checkRow = from.row + stepR * i
          const checkCol = from.col + stepC * i
          if (gameState.board[checkRow][checkCol] !== null) return false
        }
      }
    } else {
      // Other pieces move one square
      if (dr + dc !== 1) return false
    }
    
    // Can't cross lakes (middle rows 4-5, cols 2-3 and 6-7)
    if ((to.row === 4 || to.row === 5) && 
        ((to.col >= 2 && to.col <= 3) || (to.col >= 6 && to.col <= 7))) {
      return false
    }
    
    return true
  }

  const battle = (attacker: Piece, defender: Piece): 'attacker' | 'defender' | 'both' => {
    // Special cases
    if (defender.rank === 0) return 'attacker' // Captured flag
    if (defender.rank === 11) { // Bomb
      return attacker.rank === 3 ? 'attacker' : 'defender' // Only miners defuse bombs
    }
    if (attacker.rank === 1 && defender.rank === 10) return 'attacker' // Spy captures Marshal
    
    // Normal battle
    if (attacker.rank > defender.rank) return 'attacker'
    if (defender.rank > attacker.rank) return 'defender'
    return 'both' // Same rank, both removed
  }

  const makeMove = (toRow: number, toCol: number) => {
    if (!gameState.selectedPiece || gameState.gameStatus !== 'playing') return
    
    const { row: fromRow, col: fromCol } = gameState.selectedPiece
    const piece = gameState.board[fromRow][fromCol]
    
    if (!piece || piece.owner !== gameState.currentPlayer) return
    if (!canMove(gameState.selectedPiece, { row: toRow, col: toCol }, piece)) return

    setGameState(prev => {
      const board = prev.board.map(row => row ? [...row] : row)
      const targetPiece = board[toRow][toCol]
      
      if (targetPiece) {
        // Battle!
        const result = battle(piece!, targetPiece)
        targetPiece.revealed = true
        piece!.revealed = true
        
        if (result === 'attacker') {
          board[toRow][toCol] = piece
          board[fromRow][fromCol] = null
          
          if (targetPiece.rank === 0) {
            // Flag captured!
            return {
              ...prev,
              board,
              gameStatus: piece!.owner === 1 ? 'victory' : 'gameOver',
              score: piece!.owner === 1 ? prev.score + 1000 : prev.score
            }
          }
        } else if (result === 'defender') {
          board[fromRow][fromCol] = null
        } else {
          // Both removed
          board[fromRow][fromCol] = null
          board[toRow][toCol] = null
        }
      } else {
        // Normal move
        board[toRow][toCol] = piece
        board[fromRow][fromCol] = null
      }
      
      return {
        ...prev,
        board,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        selectedPiece: null,
        moveHistory: [...prev.moveHistory, `${piece!.name} ${fromRow},${fromCol} → ${toRow},${toCol}`]
      }
    })
  }

  const makeAIMove = () => {
    const aiPieces: { piece: Piece; row: number; col: number }[] = []
    
    // Find all AI pieces that can move
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = gameState.board[r][c]
        if (piece && piece.owner === 2 && piece.rank !== 0 && piece.rank !== 11) {
          aiPieces.push({ piece, row: r, col: c })
        }
      }
    }
    
    if (aiPieces.length === 0) return
    
    // Pick random piece
    const selected = aiPieces[Math.floor(Math.random() * aiPieces.length)]
    
    // Find valid moves
    const validMoves: { row: number; col: number }[] = []
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canMove({ row: selected.row, col: selected.col }, { row: r, col: c }, selected.piece)) {
          validMoves.push({ row: r, col: c })
        }
      }
    }
    
    if (validMoves.length > 0) {
      const move = validMoves[Math.floor(Math.random() * validMoves.length)]
      
      setGameState(prev => ({ ...prev, selectedPiece: { row: selected.row, col: selected.col } }))
      setTimeout(() => makeMove(move.row, move.col), 1000)
    } else {
      // Skip turn if no valid moves
      setGameState(prev => ({ ...prev, currentPlayer: 1 }))
    }
  }

  const startGame = () => {
    const playerPieces = initializePieces(1)
    setPlacementPieces(playerPieces)
    
    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'placement',
      soundEnabled: true,
      board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
      currentPlayer: 1,
      selectedPiece: null,
      moveHistory: []
    })
  }

  const placePiece = (row: number, col: number) => {
    if (gameState.gameStatus !== 'placement' || row < 6) return
    if (gameState.board[row][col] !== null) return
    if (placementPieces.length === 0) return
    
    setGameState(prev => {
      const board = prev.board.map(row => [...row])
      board[row][col] = placementPieces[0]
      
      const remaining = placementPieces.slice(1)
      setPlacementPieces(remaining)
      
      if (remaining.length === 0) {
        // Place AI pieces and start game
        const finalBoard = placeAIPieces(board)
        return {
          ...prev,
          board: finalBoard,
          gameStatus: 'playing'
        }
      }
      
      return { ...prev, board }
    })
  }

  const toggleSound = () => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
  }

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing'
    }))
  }

  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.currentPlayer === 2) {
      makeAIMove()
    }
  }, [gameState.currentPlayer, gameState.gameStatus])

  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineStratego_score', gameState.score.toString())
      localStorage.setItem('onlineStratego_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Stratego
            </h1>
            <p className="text-muted-foreground">Strategic board game with hidden pieces!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Place your army on your side</li>
              <li>• Move pieces to attack opponents</li>
              <li>• Higher ranks win battles</li>
              <li>• Capture the enemy flag to win</li>
              <li>• Miners defuse bombs, Spy beats Marshal</li>
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
              'Defeated!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {gameState.score}</p>
            <p className="text-lg text-muted-foreground">Level: {gameState.level}</p>
            <p className="text-lg text-muted-foreground">Moves: {gameState.moveHistory.length}</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  if (gameState.gameStatus === 'placement') {
    return (
      <Card className="max-w-4xl mx-auto p-4">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Place Your Army</h2>
            <p>Remaining pieces: {placementPieces.length}</p>
            {placementPieces[0] && (
              <p>Placing: {placementPieces[0].name} (Rank {placementPieces[0].rank})</p>
            )}
          </div>
          
          <div className="grid grid-cols-10 gap-0.5 mx-auto w-fit bg-gray-200 p-1">
            {gameState.board.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => placePiece(r, c)}
                  disabled={r < 6}
                  className={`
                    w-12 h-12 text-xs font-bold
                    ${r === 4 || r === 5 ? 
                      ((c >= 2 && c <= 3) || (c >= 6 && c <= 7)) ? 'bg-blue-300' : 'bg-green-100'
                      : r < 6 ? 'bg-red-100' : 'bg-green-100'
                    }
                    ${cell ? 'border-2 border-black' : ''}
                    ${r >= 6 ? 'hover:bg-green-200' : ''}
                  `}
                >
                  {cell && (
                    <div className={cell.owner === 1 ? 'text-blue-600' : 'text-red-600'}>
                      {cell.rank === 0 ? '🚩' : cell.rank === 11 ? '💣' : cell.rank}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
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

        <div className="text-center text-lg font-semibold">
          {gameState.currentPlayer === 1 ? "Your Turn" : "Enemy's Turn"}
        </div>

        <div className="grid grid-cols-10 gap-0.5 mx-auto w-fit bg-gray-200 p-1">
          {gameState.board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => {
                  if (gameState.selectedPiece) {
                    makeMove(r, c)
                  } else if (cell && cell.owner === 1) {
                    setGameState(prev => ({ ...prev, selectedPiece: { row: r, col: c } }))
                  }
                }}
                className={`
                  w-12 h-12 text-xs font-bold transition-all
                  ${r === 4 || r === 5 ? 
                    ((c >= 2 && c <= 3) || (c >= 6 && c <= 7)) ? 'bg-blue-300' : 'bg-green-100'
                    : 'bg-green-100'
                  }
                  ${cell ? 'border-2' : ''}
                  ${cell?.owner === 1 ? 'border-blue-600 text-blue-600' : ''}
                  ${cell?.owner === 2 ? 'border-red-600 text-red-600' : ''}
                  ${gameState.selectedPiece?.row === r && gameState.selectedPiece?.col === c ? 'ring-2 ring-yellow-400' : ''}
                `}
              >
                {cell && (
                  <div>
                    {cell.owner === 1 || cell.revealed ? (
                      cell.rank === 0 ? '🚩' : cell.rank === 11 ? '💣' : cell.rank
                    ) : '?'}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="max-h-20 overflow-y-auto text-sm">
          <div className="font-semibold">Move History:</div>
          {gameState.moveHistory.slice(-5).map((move, i) => (
            <div key={i}>{move}</div>
          ))}
        </div>
      </div>
    </Card>
  )
}