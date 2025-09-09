// Checkers game engine with complete rules implementation

export type PieceType = 'regular' | 'king';
export type PlayerColor = 'red' | 'black';
export type Square = {
  piece: PieceType | null;
  player: PlayerColor | null;
};

export class CheckersEngine {
  private board: Square[][] = [];
  private currentPlayer: PlayerColor = 'red';
  private selectedPiece: { row: number; col: number } | null = null;
  private possibleMoves: { row: number; col: number; captures?: { row: number; col: number }[] }[] = [];
  private mustCapture: boolean = false;
  private captureSequence: { row: number; col: number }[] = [];

  constructor() {
    this.initializeBoard();
  }

  private initializeBoard(): void {
    // Initialize 8x8 board
    this.board = Array(8).fill(null).map(() => 
      Array(8).fill(null).map(() => ({ piece: null, player: null }))
    );

    // Place black pieces (top)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          this.board[row][col] = { piece: 'regular', player: 'black' };
        }
      }
    }

    // Place red pieces (bottom)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          this.board[row][col] = { piece: 'regular', player: 'red' };
        }
      }
    }
  }

  getBoard(): Square[][] {
    return this.board.map(row => [...row]);
  }

  getCurrentPlayer(): PlayerColor {
    return this.currentPlayer;
  }

  getSelectedPiece(): { row: number; col: number } | null {
    return this.selectedPiece;
  }

  getPossibleMoves(): { row: number; col: number; captures?: { row: number; col: number }[] }[] {
    return this.possibleMoves;
  }

  selectPiece(row: number, col: number): boolean {
    const square = this.board[row][col];
    
    // Can't select empty square or opponent's piece
    if (!square.piece || square.player !== this.currentPlayer) {
      return false;
    }

    // If in capture sequence, can only select the capturing piece
    if (this.captureSequence.length > 0) {
      const lastCapture = this.captureSequence[this.captureSequence.length - 1];
      if (row !== lastCapture.row || col !== lastCapture.col) {
        return false;
      }
    }

    this.selectedPiece = { row, col };
    this.calculatePossibleMoves(row, col);
    return true;
  }

  private calculatePossibleMoves(row: number, col: number): void {
    this.possibleMoves = [];
    const piece = this.board[row][col];
    
    if (!piece.piece || piece.player !== this.currentPlayer) return;

    const captures = this.findCaptures(row, col, piece.piece);
    const regularMoves = this.findRegularMoves(row, col, piece.piece);

    // Check if any piece can capture
    const allCaptures = this.findAllCaptures();
    
    if (allCaptures.length > 0) {
      // Must capture rule - only show capture moves
      this.possibleMoves = captures;
      this.mustCapture = true;
    } else {
      // No captures available, show regular moves
      this.possibleMoves = regularMoves;
      this.mustCapture = false;
    }
  }

  private findCaptures(row: number, col: number, pieceType: PieceType): { row: number; col: number; captures: { row: number; col: number }[] }[] {
    const captures: { row: number; col: number; captures: { row: number; col: number }[] }[] = [];
    const directions = this.getDirections(pieceType, this.currentPlayer);

    for (const [dRow, dCol] of directions) {
      const jumpRow = row + dRow * 2;
      const jumpCol = col + dCol * 2;
      const captureRow = row + dRow;
      const captureCol = col + dCol;

      if (this.isValidPosition(jumpRow, jumpCol)) {
        const captureSquare = this.board[captureRow][captureCol];
        const landingSquare = this.board[jumpRow][jumpCol];

        if (captureSquare.piece && 
            captureSquare.player !== this.currentPlayer && 
            !landingSquare.piece) {
          captures.push({
            row: jumpRow,
            col: jumpCol,
            captures: [{ row: captureRow, col: captureCol }]
          });
        }
      }
    }

    return captures;
  }

  private findRegularMoves(row: number, col: number, pieceType: PieceType): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    const directions = this.getDirections(pieceType, this.currentPlayer);

    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (this.isValidPosition(newRow, newCol) && !this.board[newRow][newCol].piece) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  }

  private getDirections(pieceType: PieceType, player: PlayerColor): number[][] {
    if (pieceType === 'king') {
      // Kings can move in all diagonal directions
      return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    } else {
      // Regular pieces can only move forward
      if (player === 'red') {
        return [[-1, -1], [-1, 1]]; // Red moves up
      } else {
        return [[1, -1], [1, 1]]; // Black moves down
      }
    }
  }

  private findAllCaptures(): { row: number; col: number }[] {
    const captures: { row: number; col: number }[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.board[row][col];
        if (square.piece && square.player === this.currentPlayer) {
          const pieceCaptures = this.findCaptures(row, col, square.piece);
          if (pieceCaptures.length > 0) {
            captures.push({ row, col });
          }
        }
      }
    }

    return captures;
  }

  makeMove(toRow: number, toCol: number): { valid: boolean; captures?: { row: number; col: number }[]; gameOver?: boolean; winner?: PlayerColor } {
    if (!this.selectedPiece) {
      return { valid: false };
    }

    const move = this.possibleMoves.find(m => m.row === toRow && m.col === toCol);
    if (!move) {
      return { valid: false };
    }

    const { row: fromRow, col: fromCol } = this.selectedPiece;
    const piece = this.board[fromRow][fromCol];

    // Move the piece
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = { piece: null, player: null };

    // Handle captures
    let capturedPieces: { row: number; col: number }[] = [];
    if (move.captures && move.captures.length > 0) {
      for (const capture of move.captures) {
        this.board[capture.row][capture.col] = { piece: null, player: null };
        capturedPieces.push(capture);
      }

      // Check for additional captures from new position
      const additionalCaptures = this.findCaptures(toRow, toCol, piece.piece!);
      if (additionalCaptures.length > 0) {
        // Continue capture sequence
        this.captureSequence.push({ row: toRow, col: toCol });
        this.selectedPiece = { row: toRow, col: toCol };
        this.possibleMoves = additionalCaptures;
        return { valid: true, captures: capturedPieces };
      }
    }

    // Check for king promotion
    if (piece.player === 'red' && toRow === 0 && piece.piece === 'regular') {
      this.board[toRow][toCol].piece = 'king';
    } else if (piece.player === 'black' && toRow === 7 && piece.piece === 'regular') {
      this.board[toRow][toCol].piece = 'king';
    }

    // Check for game over
    const gameOver = this.checkGameOver();

    // Switch turns
    this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
    this.selectedPiece = null;
    this.possibleMoves = [];
    this.captureSequence = [];
    this.mustCapture = false;

    if (gameOver) {
      return { valid: true, captures: capturedPieces, gameOver: true, winner: this.getWinner() };
    }

    return { valid: true, captures: capturedPieces };
  }

  private checkGameOver(): boolean {
    // Check if current player has any pieces left
    let redPieces = 0;
    let blackPieces = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.board[row][col];
        if (square.piece) {
          if (square.player === 'red') redPieces++;
          else blackPieces++;
        }
      }
    }

    if (redPieces === 0 || blackPieces === 0) {
      return true;
    }

    // Check if current player has any valid moves
    const nextPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.board[row][col];
        if (square.piece && square.player === nextPlayer) {
          const captures = this.findCaptures(row, col, square.piece);
          const moves = this.findRegularMoves(row, col, square.piece);
          if (captures.length > 0 || moves.length > 0) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private getWinner(): PlayerColor | null {
    let redPieces = 0;
    let blackPieces = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.board[row][col];
        if (square.piece) {
          if (square.player === 'red') redPieces++;
          else blackPieces++;
        }
      }
    }

    if (redPieces > 0 && blackPieces === 0) return 'red';
    if (blackPieces > 0 && redPieces === 0) return 'black';
    
    // If both have pieces but no moves, player with more pieces wins
    if (redPieces > blackPieces) return 'red';
    if (blackPieces > redPieces) return 'black';
    
    return null; // Draw
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  getGameState() {
    return {
      board: this.getBoard(),
      currentPlayer: this.currentPlayer,
      selectedPiece: this.selectedPiece,
      possibleMoves: this.possibleMoves,
      mustCapture: this.mustCapture,
      captureSequence: this.captureSequence,
      gameOver: this.checkGameOver(),
      winner: this.getWinner()
    };
  }

  loadGameState(state: any) {
    this.board = state.board;
    this.currentPlayer = state.currentPlayer;
    this.selectedPiece = state.selectedPiece;
    this.possibleMoves = state.possibleMoves;
    this.mustCapture = state.mustCapture;
    this.captureSequence = state.captureSequence;
  }
}