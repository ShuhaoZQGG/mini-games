'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckersEngine, Square, PlayerColor } from './checkers-engine';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { useMultiplayerGame } from '@/lib/supabase/realtime';

interface CheckersGameProps {
  roomId?: string;
  isMultiplayer?: boolean;
  onGameEnd?: (winner: PlayerColor | 'draw') => void;
}

export function CheckersGame({ roomId, isMultiplayer = false, onGameEnd }: CheckersGameProps) {
  const [engine] = useState(() => new CheckersEngine());
  const [board, setBoard] = useState<Square[][]>(engine.getBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>(engine.getCurrentPlayer());
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{ row: number; col: number; captures?: { row: number; col: number }[] }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [capturedRed, setCapturedRed] = useState(0);
  const [capturedBlack, setCapturedBlack] = useState(0);
  const [playerColor, setPlayerColor] = useState<PlayerColor>('red');

  const updateGameState = useCallback(() => {
    const state = engine.getGameState();
    setBoard(state.board);
    setCurrentPlayer(state.currentPlayer);
    setSelectedPiece(state.selectedPiece);
    setPossibleMoves(state.possibleMoves);
    setGameOver(state.gameOver);
    setWinner(state.winner);
  }, [engine]);

  const { sendMove, gameState } = useMultiplayerGame({
    roomId: roomId || '',
    gameType: 'checkers',
    enabled: isMultiplayer && !!roomId,
    onGameStateChange: (state) => {
      if (state.gameData) {
        engine.loadGameState(state.gameData);
        updateGameState();
      }
      if (state.playerColor) {
        setPlayerColor(state.playerColor as PlayerColor);
      }
    }
  });

  useEffect(() => {
    updateGameState();
  }, [updateGameState]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;
    
    // In multiplayer, only allow moves for your color
    if (isMultiplayer && currentPlayer !== playerColor) return;

    const square = board[row][col];
    
    // If a piece is selected, try to move
    if (selectedPiece) {
      const result = engine.makeMove(row, col);
      if (result.valid) {
        if (result.captures && result.captures.length > 0) {
          // Update captured counts
          if (currentPlayer === 'red') {
            setCapturedBlack(prev => prev + result.captures!.length);
          } else {
            setCapturedRed(prev => prev + result.captures!.length);
          }
        }

        updateGameState();

        if (isMultiplayer) {
          sendMove({
            from: selectedPiece,
            to: { row, col },
            gameState: engine.getGameState()
          });
        }

        if (result.gameOver) {
          handleGameEnd(result.winner || null);
        }
      } else {
        // Try selecting a new piece
        if (square.piece && square.player === currentPlayer) {
          engine.selectPiece(row, col);
          updateGameState();
        }
      }
    } else {
      // Select a piece
      if (square.piece && square.player === currentPlayer) {
        engine.selectPiece(row, col);
        updateGameState();
      }
    }
  };

  const handleGameEnd = (winner: PlayerColor | null) => {
    setGameOver(true);
    setWinner(winner);
    if (onGameEnd) {
      onGameEnd(winner || 'draw');
    }
  };

  const resetGame = () => {
    const newEngine = new CheckersEngine();
    Object.assign(engine, newEngine);
    updateGameState();
    setCapturedRed(0);
    setCapturedBlack(0);
  };

  const isPossibleMove = (row: number, col: number) => {
    return possibleMoves.some(move => move.row === row && move.col === col);
  };

  const isCapture = (row: number, col: number) => {
    const move = possibleMoves.find(m => m.row === row && m.col === col);
    return move && move.captures && move.captures.length > 0;
  };

  const renderPiece = (square: Square) => {
    if (!square.piece) return null;

    return (
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${square.player === 'red' 
            ? 'bg-red-600 border-2 border-red-800' 
            : 'bg-gray-800 border-2 border-gray-900'}
          ${square.piece === 'king' ? 'ring-2 ring-yellow-400' : ''}
          transition-all duration-200 hover:scale-110
        `}
      >
        {square.piece === 'king' && (
          <Crown className="w-6 h-6 text-yellow-400" />
        )}
      </div>
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Badge variant={currentPlayer === 'red' ? 'destructive' : 'default'}>
            Current Turn: {currentPlayer === 'red' ? 'Red' : 'Black'}
          </Badge>
          {isMultiplayer && (
            <Badge variant="outline">
              You are: {playerColor === 'red' ? 'Red' : 'Black'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Red captured: {capturedRed}
          </span>
          <span className="text-sm">
            Black captured: {capturedBlack}
          </span>
        </div>
      </div>

      <div className="relative inline-block">
        <div className="grid grid-cols-8 gap-0 border-4 border-amber-900 rounded-lg overflow-hidden">
          {board.map((row, rowIndex) => (
            row.map((square, colIndex) => {
              const isDark = (rowIndex + colIndex) % 2 === 1;
              const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
              const isPossible = isPossibleMove(rowIndex, colIndex);
              const isCaptureMove = isCapture(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-14 h-14 flex items-center justify-center cursor-pointer
                    transition-all duration-200
                    ${isDark 
                      ? 'bg-amber-700 hover:bg-amber-600' 
                      : 'bg-amber-200'}
                    ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}
                    ${isPossible && !isCaptureMove ? 'ring-2 ring-green-500 ring-inset' : ''}
                    ${isCaptureMove ? 'ring-2 ring-red-500 ring-inset animate-pulse' : ''}
                  `}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {renderPiece(square)}
                </div>
              );
            })
          ))}
        </div>

        {/* Row labels */}
        <div className="absolute -left-8 top-0 h-full flex flex-col justify-around">
          {[8, 7, 6, 5, 4, 3, 2, 1].map(num => (
            <div key={num} className="text-sm font-medium text-gray-600">
              {num}
            </div>
          ))}
        </div>

        {/* Column labels */}
        <div className="absolute -bottom-8 left-0 w-full flex justify-around">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => (
            <div key={letter} className="text-sm font-medium text-gray-600">
              {letter}
            </div>
          ))}
        </div>
      </div>

      {gameOver && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg text-center">
          <h3 className="text-lg font-bold mb-2">
            {winner ? `${winner === 'red' ? 'Red' : 'Black'} Wins!` : 'Draw!'}
          </h3>
          <Button onClick={resetGame} variant="default">
            New Game
          </Button>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button onClick={resetGame} variant="outline" size="sm">
          Reset Game
        </Button>
      </div>

      {/* Game Rules */}
      <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
        <p>• Red moves first, going up the board</p>
        <p>• Captures are mandatory when available</p>
        <p>• Kings can move in any diagonal direction</p>
        <p>• Win by capturing all opponent pieces</p>
      </div>
    </Card>
  );
}