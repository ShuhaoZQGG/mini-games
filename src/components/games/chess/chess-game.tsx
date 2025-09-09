'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChessEngine, Piece, Square, Move } from './chess-engine'
import { MultiplayerGameManager } from '@/lib/supabase/realtime'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Clock, Users, Trophy, RotateCcw } from 'lucide-react'

interface ChessGameProps {
  roomId?: string
  isMultiplayer?: boolean
  onGameEnd?: (winner: 'white' | 'black' | 'draw') => void
}

export default function ChessGame({ roomId, isMultiplayer = false, onGameEnd }: ChessGameProps) {
  const [engine] = useState(() => new ChessEngine())
  const [board, setBoard] = useState(engine.getBoard())
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [validMoves, setValidMoves] = useState<Square[]>([])
  const [currentTurn, setCurrentTurn] = useState(engine.getCurrentTurn())
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [isInCheck, setIsInCheck] = useState(false)
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'stalemate' | 'draw'>('playing')
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [multiplayerManager] = useState(() => isMultiplayer ? new MultiplayerGameManager() : null)
  const [opponentConnected, setOpponentConnected] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ white: 600, black: 600 }) // 10 minutes each

  // Initialize multiplayer connection
  useEffect(() => {
    if (isMultiplayer && multiplayerManager && roomId) {
      const setupMultiplayer = async () => {
        try {
          const playerId = `player-${Date.now()}`
          await multiplayerManager.joinRoom(roomId, playerId)
          
          // Listen for opponent moves
          multiplayerManager.onGameMove((move) => {
            if (move.player_id !== playerId) {
              handleOpponentMove(move.move_data)
            }
          })
          
          // Listen for player connections
          multiplayerManager.onPlayerJoin(() => {
            setOpponentConnected(true)
          })
          
          multiplayerManager.onPlayerLeave(() => {
            setOpponentConnected(false)
          })
          
          // Determine player color based on join order
          const presence = multiplayerManager.getPresenceState()
          const playerCount = Object.keys(presence).length
          setPlayerColor(playerCount === 1 ? 'white' : 'black')
        } catch (error) {
          console.error('Failed to join room:', error)
        }
      }
      
      setupMultiplayer()
      
      return () => {
        multiplayerManager.leaveRoom()
      }
    }
  }, [isMultiplayer, multiplayerManager, roomId])

  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'playing') return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => ({
        ...prev,
        [currentTurn]: Math.max(0, prev[currentTurn] - 1)
      }))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [currentTurn, gameStatus])

  // Check for time out
  useEffect(() => {
    if (timeLeft[currentTurn] === 0 && gameStatus === 'playing') {
      const winner = currentTurn === 'white' ? 'black' : 'white'
      setGameStatus('checkmate')
      onGameEnd?.(winner)
    }
  }, [timeLeft, currentTurn, gameStatus, onGameEnd])

  const handleOpponentMove = useCallback((moveData: { from: Square; to: Square }) => {
    const move = engine.makeMove(moveData.from, moveData.to)
    if (move) {
      setBoard(engine.getBoard())
      setCurrentTurn(engine.getCurrentTurn())
      setMoveHistory(engine.getMoveHistory())
      updateGameStatus()
    }
  }, [engine])

  const handleSquareClick = useCallback((row: number, col: number) => {
    const square: Square = [row, col]
    const piece = engine.getPiece(square)
    
    // In multiplayer, only allow moves for player's color
    if (isMultiplayer && currentTurn !== playerColor) return
    
    if (selectedSquare) {
      // Try to make a move
      const move = engine.makeMove(selectedSquare, square)
      if (move) {
        setBoard(engine.getBoard())
        setCurrentTurn(engine.getCurrentTurn())
        setMoveHistory(engine.getMoveHistory())
        
        // Send move to opponent in multiplayer
        if (isMultiplayer && multiplayerManager) {
          multiplayerManager.sendMove({ from: selectedSquare, to: square })
        }
        
        updateGameStatus()
        setSelectedSquare(null)
        setValidMoves([])
      } else if (piece && piece.color === currentTurn) {
        // Select a different piece
        setSelectedSquare(square)
        setValidMoves(engine.getValidMoves(square))
      } else {
        // Deselect
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else if (piece && piece.color === currentTurn) {
      // Select a piece
      setSelectedSquare(square)
      setValidMoves(engine.getValidMoves(square))
    }
  }, [selectedSquare, engine, currentTurn, isMultiplayer, playerColor, multiplayerManager])

  const updateGameStatus = useCallback(() => {
    setIsInCheck(engine.isInCheck(engine.getCurrentTurn()))
    
    if (engine.isCheckmate()) {
      setGameStatus('checkmate')
      const winner = engine.getCurrentTurn() === 'white' ? 'black' : 'white'
      onGameEnd?.(winner)
    } else if (engine.isStalemate()) {
      setGameStatus('stalemate')
      onGameEnd?.('draw')
    }
  }, [engine, onGameEnd])

  const resetGame = () => {
    engine.initializeBoard()
    setBoard(engine.getBoard())
    setCurrentTurn('white')
    setMoveHistory([])
    setSelectedSquare(null)
    setValidMoves([])
    setIsInCheck(false)
    setGameStatus('playing')
    setTimeLeft({ white: 600, black: 600 })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPieceSymbol = (piece: Piece) => {
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    }
    return symbols[piece.color][piece.type]
  }

  const isSquareHighlighted = (row: number, col: number) => {
    return validMoves.some(([r, c]) => r === row && c === col)
  }

  const isSquareSelected = (row: number, col: number) => {
    return selectedSquare?.[0] === row && selectedSquare?.[1] === col
  }

  const getSquareColor = (row: number, col: number) => {
    const isLight = (row + col) % 2 === 0
    
    if (isSquareSelected(row, col)) {
      return 'bg-yellow-400'
    }
    
    if (isSquareHighlighted(row, col)) {
      const piece = engine.getPiece([row, col])
      if (piece) {
        return isLight ? 'bg-red-300' : 'bg-red-500'
      }
      return isLight ? 'bg-green-300' : 'bg-green-500'
    }
    
    return isLight ? 'bg-amber-100' : 'bg-amber-700'
  }

  // Rotate board for black player in multiplayer
  const displayBoard = isMultiplayer && playerColor === 'black' 
    ? board.slice().reverse().map(row => row.slice().reverse())
    : board

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto">
      {/* Chess Board */}
      <Card className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className={currentTurn === 'black' ? 'font-bold' : ''}>
              Black: {formatTime(timeLeft.black)}
            </span>
          </div>
          {isMultiplayer && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className={opponentConnected ? 'text-green-600' : 'text-yellow-600'}>
                {opponentConnected ? 'Connected' : 'Waiting...'}
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 mb-4">
          {displayBoard.map((row, rowIndex) => 
            row.map((piece, colIndex) => {
              const actualRow = isMultiplayer && playerColor === 'black' ? 7 - rowIndex : rowIndex
              const actualCol = isMultiplayer && playerColor === 'black' ? 7 - colIndex : colIndex
              
              return (
                <button
                  key={`${actualRow}-${actualCol}`}
                  className={`
                    aspect-square flex items-center justify-center text-5xl
                    transition-colors duration-200 hover:opacity-80
                    ${getSquareColor(actualRow, actualCol)}
                  `}
                  onClick={() => handleSquareClick(actualRow, actualCol)}
                  disabled={gameStatus !== 'playing' || (isMultiplayer && !opponentConnected)}
                >
                  {piece && getPieceSymbol(piece)}
                </button>
              )
            })
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className={currentTurn === 'white' ? 'font-bold' : ''}>
              White: {formatTime(timeLeft.white)}
            </span>
          </div>
          <Button onClick={resetGame} size="sm" variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
      </Card>

      {/* Game Info Panel */}
      <Card className="p-4 min-w-[300px]">
        <h2 className="text-xl font-bold mb-4">Game Info</h2>
        
        {/* Status */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Status</h3>
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
            {gameStatus === 'playing' ? (
              <>
                <p>Current Turn: <span className="font-bold">{currentTurn}</span></p>
                {isInCheck && <p className="text-red-600 font-bold">CHECK!</p>}
                {isMultiplayer && (
                  <p>You are playing: <span className="font-bold">{playerColor}</span></p>
                )}
              </>
            ) : gameStatus === 'checkmate' ? (
              <p className="text-green-600 font-bold">
                CHECKMATE! {currentTurn === 'white' ? 'Black' : 'White'} wins!
              </p>
            ) : (
              <p className="text-yellow-600 font-bold">STALEMATE - Draw!</p>
            )}
          </div>
        </div>
        
        {/* Captured Pieces */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Captured Pieces</h3>
          <div className="space-y-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">By White:</p>
              <div className="text-2xl">
                {engine.getCapturedPieces().black.map((piece, i) => (
                  <span key={i}>{getPieceSymbol(piece)}</span>
                ))}
              </div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">By Black:</p>
              <div className="text-2xl">
                {engine.getCapturedPieces().white.map((piece, i) => (
                  <span key={i}>{getPieceSymbol(piece)}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Move History */}
        <div>
          <h3 className="font-semibold mb-2">Move History</h3>
          <div className="max-h-40 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">
            {moveHistory.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No moves yet</p>
            ) : (
              <div className="text-sm space-y-1">
                {moveHistory.map((move, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-mono">
                      {Math.floor(i / 2) + 1}.
                    </span>
                    <span>
                      {String.fromCharCode(97 + move.from[1])}{move.from[0] + 1}
                      →
                      {String.fromCharCode(97 + move.to[1])}{move.to[0] + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}