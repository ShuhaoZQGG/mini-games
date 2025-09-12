export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
export type PieceColor = 'white' | 'black'
export type Square = [number, number]

export interface Piece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean
}

export interface Move {
  from: Square
  to: Square
  piece: Piece
  captured?: Piece
  promotion?: PieceType
  castling?: 'kingside' | 'queenside'
  enPassant?: boolean
}

export class ChessEngine {
  private board: (Piece | null)[][] = []
  private currentTurn: PieceColor = 'white'
  private moveHistory: Move[] = []
  private capturedPieces: { white: Piece[], black: Piece[] } = { white: [], black: [] }
  private enPassantTarget: Square | null = null
  private inCheck: { white: boolean, black: boolean } = { white: false, black: false }

  constructor() {
    this.initializeBoard()
  }

  initializeBoard(): void {
    // Initialize empty board
    for (let i = 0; i < 8; i++) {
      this.board[i] = new Array(8).fill(null)
    }

    // Place pieces in starting positions
    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    
    // White pieces
    for (let i = 0; i < 8; i++) {
      this.board[1][i] = { type: 'pawn', color: 'white' }
      this.board[0][i] = { type: backRow[i], color: 'white' }
    }
    
    // Black pieces
    for (let i = 0; i < 8; i++) {
      this.board[6][i] = { type: 'pawn', color: 'black' }
      this.board[7][i] = { type: backRow[i], color: 'black' }
    }
  }

  getBoard(): (Piece | null)[][] {
    return this.board.map(row => [...row])
  }

  getCurrentTurn(): PieceColor {
    return this.currentTurn
  }

  getPiece(square: Square): Piece | null {
    const [row, col] = square
    return this.board[row]?.[col] || null
  }

  getValidMoves(from: Square): Square[] {
    const piece = this.getPiece(from)
    if (!piece || piece.color !== this.currentTurn) return []

    const validMoves: Square[] = []
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const to: Square = [row, col]
        if (this.isValidMove(from, to)) {
          validMoves.push(to)
        }
      }
    }
    
    return validMoves
  }

  private isValidMove(from: Square, to: Square): boolean {
    const piece = this.getPiece(from)
    if (!piece) return false

    // Can't capture own piece
    const targetPiece = this.getPiece(to)
    if (targetPiece && targetPiece.color === piece.color) return false

    // Check piece-specific movement rules
    if (!this.isPieceMovementValid(piece, from, to)) return false

    // Check if move would leave king in check
    if (this.wouldLeaveInCheck(from, to, piece.color)) return false

    return true
  }

  private isPieceMovementValid(piece: Piece, from: Square, to: Square): boolean {
    const [fromRow, fromCol] = from
    const [toRow, toCol] = to
    const rowDiff = toRow - fromRow
    const colDiff = toCol - fromCol
    const absRowDiff = Math.abs(rowDiff)
    const absColDiff = Math.abs(colDiff)

    switch (piece.type) {
      case 'pawn':
        return this.isPawnMoveValid(piece, from, to)
      
      case 'rook':
        return (rowDiff === 0 || colDiff === 0) && this.isPathClear(from, to)
      
      case 'knight':
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2)
      
      case 'bishop':
        return absRowDiff === absColDiff && this.isPathClear(from, to)
      
      case 'queen':
        return ((rowDiff === 0 || colDiff === 0) || (absRowDiff === absColDiff)) && this.isPathClear(from, to)
      
      case 'king':
        return absRowDiff <= 1 && absColDiff <= 1 || this.isCastlingMove(piece, from, to)
      
      default:
        return false
    }
  }

  private isPawnMoveValid(piece: Piece, from: Square, to: Square): boolean {
    const [fromRow, fromCol] = from
    const [toRow, toCol] = to
    const direction = piece.color === 'white' ? 1 : -1
    const startRow = piece.color === 'white' ? 1 : 6
    const targetPiece = this.getPiece(to)

    // Forward move
    if (fromCol === toCol && !targetPiece) {
      // Single step
      if (toRow - fromRow === direction) return true
      // Double step from starting position
      if (fromRow === startRow && toRow - fromRow === 2 * direction) {
        return !this.getPiece([fromRow + direction, fromCol])
      }
    }

    // Diagonal capture
    if (Math.abs(toCol - fromCol) === 1 && toRow - fromRow === direction) {
      // Regular capture
      if (targetPiece && targetPiece.color !== piece.color) return true
      // En passant
      if (this.enPassantTarget && this.enPassantTarget[0] === toRow && this.enPassantTarget[1] === toCol) {
        return true
      }
    }

    return false
  }

  private isCastlingMove(king: Piece, from: Square, to: Square): boolean {
    if (king.hasMoved || this.inCheck[king.color]) return false
    
    const [fromRow, fromCol] = from
    const [toRow, toCol] = to
    
    if (fromRow !== toRow) return false
    
    // Kingside castling
    if (toCol - fromCol === 2) {
      const rook = this.getPiece([fromRow, 7])
      if (!rook || rook.type !== 'rook' || rook.hasMoved) return false
      if (!this.isPathClear(from, [fromRow, 7])) return false
      // Check if squares king passes through are under attack
      for (let col = fromCol; col <= toCol; col++) {
        if (this.isSquareUnderAttack([fromRow, col], king.color === 'white' ? 'black' : 'white')) {
          return false
        }
      }
      return true
    }
    
    // Queenside castling
    if (toCol - fromCol === -2) {
      const rook = this.getPiece([fromRow, 0])
      if (!rook || rook.type !== 'rook' || rook.hasMoved) return false
      if (!this.isPathClear([fromRow, 0], from)) return false
      // Check if squares king passes through are under attack
      for (let col = toCol; col <= fromCol; col++) {
        if (this.isSquareUnderAttack([fromRow, col], king.color === 'white' ? 'black' : 'white')) {
          return false
        }
      }
      return true
    }
    
    return false
  }

  private isPathClear(from: Square, to: Square): boolean {
    const [fromRow, fromCol] = from
    const [toRow, toCol] = to
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0
    
    let currentRow = fromRow + rowStep
    let currentCol = fromCol + colStep
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (this.getPiece([currentRow, currentCol])) return false
      currentRow += rowStep
      currentCol += colStep
    }
    
    return true
  }

  private isSquareUnderAttack(square: Square, byColor: PieceColor): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece([row, col])
        if (piece && piece.color === byColor) {
          if (this.isPieceMovementValid(piece, [row, col], square)) {
            return true
          }
        }
      }
    }
    return false
  }

  private wouldLeaveInCheck(from: Square, to: Square, color: PieceColor): boolean {
    // Make temporary move
    const piece = this.getPiece(from)!
    const capturedPiece = this.getPiece(to)
    this.board[to[0]][to[1]] = piece
    this.board[from[0]][from[1]] = null
    
    // Find king position
    let kingPos: Square | null = null
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const p = this.getPiece([row, col])
        if (p && p.type === 'king' && p.color === color) {
          kingPos = [row, col]
          break
        }
      }
      if (kingPos) break
    }
    
    const inCheck = kingPos ? this.isSquareUnderAttack(kingPos, color === 'white' ? 'black' : 'white') : false
    
    // Undo temporary move
    this.board[from[0]][from[1]] = piece
    this.board[to[0]][to[1]] = capturedPiece
    
    return inCheck
  }

  makeMove(from: Square, to: Square): Move | null {
    if (!this.isValidMove(from, to)) return null
    
    const piece = this.getPiece(from)!
    const capturedPiece = this.getPiece(to)
    
    const move: Move = {
      from,
      to,
      piece: { ...piece },
      captured: capturedPiece || undefined
    }
    
    // Handle special moves
    if (piece.type === 'pawn') {
      // En passant capture
      if (this.enPassantTarget && to[0] === this.enPassantTarget[0] && to[1] === this.enPassantTarget[1]) {
        const capturedPawnRow = piece.color === 'white' ? to[0] - 1 : to[0] + 1
        move.captured = this.getPiece([capturedPawnRow, to[1]]) || undefined
        move.enPassant = true
        this.board[capturedPawnRow][to[1]] = null
      }
      
      // Promotion
      if ((piece.color === 'white' && to[0] === 7) || (piece.color === 'black' && to[0] === 0)) {
        piece.type = 'queen' // Auto-promote to queen for simplicity
        move.promotion = 'queen'
      }
      
      // Set en passant target
      if (Math.abs(to[0] - from[0]) === 2) {
        this.enPassantTarget = [(from[0] + to[0]) / 2, from[1]]
      } else {
        this.enPassantTarget = null
      }
    } else {
      this.enPassantTarget = null
    }
    
    // Handle castling
    if (piece.type === 'king' && Math.abs(to[1] - from[1]) === 2) {
      const isKingside = to[1] > from[1]
      move.castling = isKingside ? 'kingside' : 'queenside'
      
      // Move rook
      if (isKingside) {
        this.board[from[0]][5] = this.board[from[0]][7]
        this.board[from[0]][7] = null
        if (this.board[from[0]][5]) this.board[from[0]][5]!.hasMoved = true
      } else {
        this.board[from[0]][3] = this.board[from[0]][0]
        this.board[from[0]][0] = null
        if (this.board[from[0]][3]) this.board[from[0]][3]!.hasMoved = true
      }
    }
    
    // Make the move
    this.board[to[0]][to[1]] = piece
    this.board[from[0]][from[1]] = null
    piece.hasMoved = true
    
    // Handle captures
    if (capturedPiece) {
      this.capturedPieces[capturedPiece.color].push(capturedPiece)
    }
    
    // Update game state
    this.moveHistory.push(move)
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white'
    
    // Check for check
    this.updateCheckStatus()
    
    return move
  }

  private updateCheckStatus(): void {
    for (const color of ['white', 'black'] as PieceColor[]) {
      // Find king
      let kingPos: Square | null = null
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.getPiece([row, col])
          if (piece && piece.type === 'king' && piece.color === color) {
            kingPos = [row, col]
            break
          }
        }
        if (kingPos) break
      }
      
      this.inCheck[color] = kingPos ? this.isSquareUnderAttack(kingPos, color === 'white' ? 'black' : 'white') : false
    }
  }

  isInCheck(color: PieceColor): boolean {
    return this.inCheck[color]
  }

  isCheckmate(): boolean {
    if (!this.inCheck[this.currentTurn]) return false
    
    // Check if any move can get out of check
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece([row, col])
        if (piece && piece.color === this.currentTurn) {
          const validMoves = this.getValidMoves([row, col])
          if (validMoves.length > 0) return false
        }
      }
    }
    
    return true
  }

  isStalemate(): boolean {
    if (this.inCheck[this.currentTurn]) return false
    
    // Check if any move is possible
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece([row, col])
        if (piece && piece.color === this.currentTurn) {
          const validMoves = this.getValidMoves([row, col])
          if (validMoves.length > 0) return false
        }
      }
    }
    
    return true
  }

  getMoveHistory(): Move[] {
    return [...this.moveHistory]
  }

  getCapturedPieces(): { white: Piece[], black: Piece[] } {
    return {
      white: [...this.capturedPieces.white],
      black: [...this.capturedPieces.black]
    }
  }

  // Convert board state to FEN notation for saving/loading
  toFEN(): string {
    let fen = ''
    
    for (let row = 7; row >= 0; row--) {
      let emptyCount = 0
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece([row, col])
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount
            emptyCount = 0
          }
          const letter = this.pieceToFENChar(piece)
          fen += piece.color === 'white' ? letter.toUpperCase() : letter.toLowerCase()
        } else {
          emptyCount++
        }
      }
      if (emptyCount > 0) fen += emptyCount
      if (row > 0) fen += '/'
    }
    
    fen += ` ${this.currentTurn.charAt(0)}`
    
    return fen
  }

  private pieceToFENChar(piece: Piece): string {
    switch (piece.type) {
      case 'pawn': return 'p'
      case 'rook': return 'r'
      case 'knight': return 'n'
      case 'bishop': return 'b'
      case 'queen': return 'q'
      case 'king': return 'k'
    }
  }

  // Load board state from FEN notation
  loadFEN(fen: string): void {
    const parts = fen.split(' ')
    const boardPart = parts[0]
    const rows = boardPart.split('/')
    
    for (let i = 0; i < 8; i++) {
      this.board[i] = new Array(8).fill(null)
    }
    
    for (let row = 0; row < 8; row++) {
      let col = 0
      for (const char of rows[7 - row]) {
        if (/\d/.test(char)) {
          col += parseInt(char)
        } else {
          const color: PieceColor = char === char.toUpperCase() ? 'white' : 'black'
          const type = this.fenCharToPiece(char.toLowerCase())
          if (type) {
            this.board[row][col] = { type, color }
            col++
          }
        }
      }
    }
    
    this.currentTurn = parts[1] === 'w' ? 'white' : 'black'
    this.updateCheckStatus()
  }

  private fenCharToPiece(char: string): PieceType | null {
    switch (char) {
      case 'p': return 'pawn'
      case 'r': return 'rook'
      case 'n': return 'knight'
      case 'b': return 'bishop'
      case 'q': return 'queen'
      case 'k': return 'king'
      default: return null
    }
  }
}