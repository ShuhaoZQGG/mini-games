'use client';

import { useState, useEffect } from 'react';
import { BattleshipEngine, CellState, ShipType, Direction } from './battleship-engine';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, RotateCw, Target, Waves } from 'lucide-react';

interface BattleshipGameProps {
  onGameEnd?: (winner: 'player' | 'opponent') => void;
}

export function BattleshipGame({ onGameEnd }: BattleshipGameProps) {
  const [engine] = useState(() => new BattleshipEngine());
  const [phase, setPhase] = useState<'placement' | 'battle'>('placement');
  const [playerBoard, setPlayerBoard] = useState<CellState[][]>(engine.getPlayerBoard());
  const [opponentBoard, setOpponentBoard] = useState<CellState[][]>(engine.getOpponentBoard());
  const [currentShip, setCurrentShip] = useState<ShipType>('carrier');
  const [direction, setDirection] = useState<Direction>('horizontal');
  const [placedShips, setPlacedShips] = useState<ShipType[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [lastShot, setLastShot] = useState<{ row: number; col: number } | null>(null);
  const [message, setMessage] = useState('Place your ships on the board');

  const ships: { type: ShipType; name: string; size: number }[] = [
    { type: 'carrier', name: 'Carrier', size: 5 },
    { type: 'battleship', name: 'Battleship', size: 4 },
    { type: 'cruiser', name: 'Cruiser', size: 3 },
    { type: 'submarine', name: 'Submarine', size: 3 },
    { type: 'destroyer', name: 'Destroyer', size: 2 },
  ];

  const handleCellClick = (row: number, col: number, board: 'player' | 'opponent') => {
    if (phase === 'placement' && board === 'player') {
      // Place ship
      if (engine.placeShip('player', currentShip, row, col, direction)) {
        const newPlacedShips = [...placedShips, currentShip];
        setPlacedShips(newPlacedShips);
        setPlayerBoard(engine.getPlayerBoard());

        // Move to next ship
        const remainingShips = ships.filter(s => !newPlacedShips.includes(s.type));
        if (remainingShips.length > 0) {
          setCurrentShip(remainingShips[0].type);
          setMessage(`Place your ${remainingShips[0].name} (${remainingShips[0].size} cells)`);
        } else {
          // All ships placed, start battle
          startBattle();
        }
      } else {
        setMessage('Invalid placement. Try another position.');
      }
    } else if (phase === 'battle' && board === 'opponent' && currentTurn === 'player') {
      // Fire at opponent
      const result = engine.fire(row, col);
      setOpponentBoard(engine.getOpponentBoard());
      setLastShot({ row, col });

      if (result.hit) {
        if (result.sunk) {
          setMessage(`You sunk the enemy ${result.shipType}!`);
        } else {
          setMessage('Hit!');
        }
      } else {
        setMessage('Miss!');
      }

      if (result.gameOver) {
        handleGameEnd('player');
      } else {
        setCurrentTurn('opponent');
        // AI turn after delay
        setTimeout(() => makeAIMove(), 1500);
      }
    }
  };

  const startBattle = () => {
    // Place opponent ships randomly
    engine.placeRandomShips('opponent');
    setPhase('battle');
    setMessage('Battle begins! Click on the enemy board to fire.');
    setCurrentTurn('player');
  };

  const makeAIMove = () => {
    // Simple AI: random shots
    let validShot = false;
    let attempts = 0;
    
    while (!validShot && attempts < 100) {
      const row = Math.floor(Math.random() * 10);
      const col = Math.floor(Math.random() * 10);
      const board = engine.getPlayerBoard();
      
      if (board[row][col] !== 'hit' && board[row][col] !== 'miss') {
        const result = engine.fire(row, col);
        setPlayerBoard(engine.getPlayerBoard());
        
        if (result.hit) {
          if (result.sunk) {
            setMessage(`Enemy sunk your ${result.shipType}!`);
          } else {
            setMessage('Enemy hit your ship!');
          }
        } else {
          setMessage('Enemy missed!');
        }

        if (result.gameOver) {
          handleGameEnd('opponent');
        } else {
          setCurrentTurn('player');
        }
        
        validShot = true;
      }
      attempts++;
    }
  };

  const handleGameEnd = (winner: 'player' | 'opponent') => {
    setGameOver(true);
    setWinner(winner);
    setMessage(winner === 'player' ? 'Victory! You sunk all enemy ships!' : 'Defeat! All your ships were sunk.');
    if (onGameEnd) {
      onGameEnd(winner);
    }
  };

  const resetGame = () => {
    const newEngine = new BattleshipEngine();
    Object.assign(engine, newEngine);
    setPhase('placement');
    setPlayerBoard(engine.getPlayerBoard());
    setOpponentBoard(engine.getOpponentBoard());
    setCurrentShip('carrier');
    setDirection('horizontal');
    setPlacedShips([]);
    setCurrentTurn('player');
    setGameOver(false);
    setWinner(null);
    setLastShot(null);
    setMessage('Place your ships on the board');
  };

  const randomPlacement = () => {
    engine.clearBoard('player');
    engine.placeRandomShips('player');
    setPlayerBoard(engine.getPlayerBoard());
    setPlacedShips(['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']);
    startBattle();
  };

  const renderCell = (cell: CellState, row: number, col: number, isOpponent: boolean) => {
    const isLastShot = lastShot?.row === row && lastShot?.col === col;
    
    return (
      <div
        className={`
          w-8 h-8 border border-blue-300 flex items-center justify-center
          cursor-pointer transition-all duration-200
          ${cell === 'empty' ? 'bg-blue-100 hover:bg-blue-200' : ''}
          ${cell === 'ship' && !isOpponent ? 'bg-gray-600' : ''}
          ${cell === 'hit' ? 'bg-red-500' : ''}
          ${cell === 'miss' ? 'bg-blue-300' : ''}
          ${cell === 'sunk' ? 'bg-red-800' : ''}
          ${isLastShot ? 'ring-2 ring-yellow-400' : ''}
        `}
      >
        {cell === 'hit' && <Target className="w-4 h-4 text-white" />}
        {cell === 'miss' && <Waves className="w-4 h-4 text-blue-600" />}
        {cell === 'sunk' && <Anchor className="w-4 h-4 text-white" />}
        {cell === 'ship' && !isOpponent && <Anchor className="w-4 h-4 text-gray-300" />}
      </div>
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Battleship</h2>
        <Badge variant={phase === 'placement' ? 'secondary' : 'default'}>
          {phase === 'placement' ? 'Ship Placement Phase' : `Battle Phase - ${currentTurn === 'player' ? 'Your' : "Enemy's"} Turn`}
        </Badge>
      </div>

      <div className="mb-4 text-center">
        <p className="text-sm font-medium">{message}</p>
      </div>

      <div className="flex gap-8 justify-center">
        {/* Player Board */}
        <div>
          <h3 className="text-center font-semibold mb-2">Your Fleet</h3>
          <div className="relative">
            <div className="grid grid-cols-10 gap-0">
              {playerBoard.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <div
                    key={`player-${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex, 'player')}
                  >
                    {renderCell(cell, rowIndex, colIndex, false)}
                  </div>
                ))
              ))}
            </div>
            {/* Grid labels */}
            <div className="absolute -left-6 top-0 h-full flex flex-col justify-around">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <div key={num} className="text-xs font-medium">{num}</div>
              ))}
            </div>
            <div className="absolute -top-6 left-0 w-full flex justify-around">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(letter => (
                <div key={letter} className="text-xs font-medium">{letter}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Opponent Board */}
        <div>
          <h3 className="text-center font-semibold mb-2">Enemy Waters</h3>
          <div className="relative">
            <div className="grid grid-cols-10 gap-0">
              {opponentBoard.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <div
                    key={`opponent-${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex, 'opponent')}
                  >
                    {renderCell(cell, rowIndex, colIndex, true)}
                  </div>
                ))
              ))}
            </div>
            {/* Grid labels */}
            <div className="absolute -left-6 top-0 h-full flex flex-col justify-around">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <div key={num} className="text-xs font-medium">{num}</div>
              ))}
            </div>
            <div className="absolute -top-6 left-0 w-full flex justify-around">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(letter => (
                <div key={letter} className="text-xs font-medium">{letter}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {phase === 'placement' && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-center gap-2">
            {ships.map(ship => (
              <Badge
                key={ship.type}
                variant={placedShips.includes(ship.type) ? 'secondary' : currentShip === ship.type ? 'default' : 'outline'}
              >
                {ship.name} ({ship.size})
              </Badge>
            ))}
          </div>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setDirection(d => d === 'horizontal' ? 'vertical' : 'horizontal')}
              variant="outline"
              size="sm"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              {direction === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </Button>
            <Button onClick={randomPlacement} variant="outline" size="sm">
              Random Placement
            </Button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="mt-6 text-center">
          <h3 className="text-lg font-bold mb-2">
            {winner === 'player' ? '🎉 Victory!' : '💀 Defeat'}
          </h3>
          <Button onClick={resetGame}>New Game</Button>
        </div>
      )}

      {!gameOver && phase === 'battle' && (
        <div className="mt-4 flex justify-center">
          <Button onClick={resetGame} variant="outline" size="sm">
            Restart Game
          </Button>
        </div>
      )}
    </Card>
  );
}