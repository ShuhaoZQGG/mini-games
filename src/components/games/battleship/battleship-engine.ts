// Battleship game engine

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';
export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';
export type Direction = 'horizontal' | 'vertical';

interface Ship {
  type: ShipType;
  size: number;
  positions: { row: number; col: number }[];
  hits: number;
  sunk: boolean;
}

export class BattleshipEngine {
  private playerBoard: CellState[][] = [];
  private opponentBoard: CellState[][] = [];
  private playerShips: Ship[] = [];
  private opponentShips: Ship[] = [];
  private currentTurn: 'player' | 'opponent' = 'player';
  private gameOver = false;
  private winner: 'player' | 'opponent' | null = null;

  private shipSizes: Record<ShipType, number> = {
    carrier: 5,
    battleship: 4,
    cruiser: 3,
    submarine: 3,
    destroyer: 2
  };

  constructor() {
    this.initializeBoards();
  }

  private initializeBoards(): void {
    // Initialize 10x10 boards
    this.playerBoard = Array(10).fill(null).map(() => Array(10).fill('empty'));
    this.opponentBoard = Array(10).fill(null).map(() => Array(10).fill('empty'));
  }

  placeShip(
    board: 'player' | 'opponent',
    shipType: ShipType,
    row: number,
    col: number,
    direction: Direction
  ): boolean {
    const size = this.shipSizes[shipType];
    const positions: { row: number; col: number }[] = [];

    // Calculate positions
    for (let i = 0; i < size; i++) {
      const newRow = direction === 'vertical' ? row + i : row;
      const newCol = direction === 'horizontal' ? col + i : col;

      if (!this.isValidPosition(newRow, newCol)) {
        return false;
      }

      positions.push({ row: newRow, col: newCol });
    }

    // Check for overlaps
    const targetBoard = board === 'player' ? this.playerBoard : this.opponentBoard;
    for (const pos of positions) {
      if (targetBoard[pos.row][pos.col] !== 'empty') {
        return false;
      }
    }

    // Place ship
    for (const pos of positions) {
      targetBoard[pos.row][pos.col] = 'ship';
    }

    const ship: Ship = {
      type: shipType,
      size,
      positions,
      hits: 0,
      sunk: false
    };

    if (board === 'player') {
      this.playerShips.push(ship);
    } else {
      this.opponentShips.push(ship);
    }

    return true;
  }

  placeRandomShips(board: 'player' | 'opponent'): void {
    const ships: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
    
    for (const shipType of ships) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        const direction: Direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        
        placed = this.placeShip(board, shipType, row, col, direction);
        attempts++;
      }
    }
  }

  fire(row: number, col: number): { hit: boolean; sunk: boolean; shipType?: ShipType; gameOver: boolean } {
    if (this.gameOver || !this.isValidPosition(row, col)) {
      return { hit: false, sunk: false, gameOver: this.gameOver };
    }

    const targetBoard = this.currentTurn === 'player' ? this.opponentBoard : this.playerBoard;
    const targetShips = this.currentTurn === 'player' ? this.opponentShips : this.playerShips;

    if (targetBoard[row][col] === 'hit' || targetBoard[row][col] === 'miss') {
      return { hit: false, sunk: false, gameOver: false };
    }

    if (targetBoard[row][col] === 'ship') {
      targetBoard[row][col] = 'hit';

      // Find which ship was hit
      for (const ship of targetShips) {
        const hitPos = ship.positions.find(pos => pos.row === row && pos.col === col);
        if (hitPos) {
          ship.hits++;
          
          if (ship.hits === ship.size) {
            ship.sunk = true;
            // Mark all positions as sunk
            for (const pos of ship.positions) {
              targetBoard[pos.row][pos.col] = 'sunk';
            }

            // Check for game over
            if (this.checkGameOver()) {
              this.gameOver = true;
              this.winner = this.currentTurn;
            }

            return { hit: true, sunk: true, shipType: ship.type, gameOver: this.gameOver };
          }
          
          return { hit: true, sunk: false, gameOver: false };
        }
      }
    } else {
      targetBoard[row][col] = 'miss';
    }

    // Switch turns
    this.currentTurn = this.currentTurn === 'player' ? 'opponent' : 'player';
    
    return { hit: false, sunk: false, gameOver: false };
  }

  private checkGameOver(): boolean {
    const targetShips = this.currentTurn === 'player' ? this.opponentShips : this.playerShips;
    return targetShips.every(ship => ship.sunk);
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 10 && col >= 0 && col < 10;
  }

  getPlayerBoard(): CellState[][] {
    return this.playerBoard.map(row => [...row]);
  }

  getOpponentBoard(): CellState[][] {
    // Return a hidden version for the player
    return this.opponentBoard.map(row => 
      row.map(cell => {
        if (cell === 'ship') return 'empty';
        return cell;
      })
    );
  }

  getCurrentTurn(): 'player' | 'opponent' {
    return this.currentTurn;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  getWinner(): 'player' | 'opponent' | null {
    return this.winner;
  }

  getPlayerShips(): Ship[] {
    return this.playerShips;
  }

  getOpponentShips(): Ship[] {
    return this.opponentShips;
  }

  allShipsPlaced(board: 'player' | 'opponent'): boolean {
    const ships = board === 'player' ? this.playerShips : this.opponentShips;
    return ships.length === 5;
  }

  removeShip(board: 'player' | 'opponent', shipType: ShipType): void {
    const targetBoard = board === 'player' ? this.playerBoard : this.opponentBoard;
    const targetShips = board === 'player' ? this.playerShips : this.opponentShips;
    
    const shipIndex = targetShips.findIndex(ship => ship.type === shipType);
    if (shipIndex !== -1) {
      const ship = targetShips[shipIndex];
      
      // Clear board positions
      for (const pos of ship.positions) {
        targetBoard[pos.row][pos.col] = 'empty';
      }
      
      // Remove ship from array
      targetShips.splice(shipIndex, 1);
    }
  }

  clearBoard(board: 'player' | 'opponent'): void {
    if (board === 'player') {
      this.playerBoard = Array(10).fill(null).map(() => Array(10).fill('empty'));
      this.playerShips = [];
    } else {
      this.opponentBoard = Array(10).fill(null).map(() => Array(10).fill('empty'));
      this.opponentShips = [];
    }
  }

  getGameState() {
    return {
      playerBoard: this.playerBoard,
      opponentBoard: this.opponentBoard,
      playerShips: this.playerShips,
      opponentShips: this.opponentShips,
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }

  loadGameState(state: any) {
    this.playerBoard = state.playerBoard;
    this.opponentBoard = state.opponentBoard;
    this.playerShips = state.playerShips;
    this.opponentShips = state.opponentShips;
    this.currentTurn = state.currentTurn;
    this.gameOver = state.gameOver;
    this.winner = state.winner;
  }
}