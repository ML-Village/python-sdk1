import { Board, Position, Piece, PieceType, Move, PieceColor } from '../types/chess';


export function isCheckmate(board: Board, color: PieceColor): boolean {
    if (!isInCheck(board, color)) return false;
  
    // Check if any move can get the king out of check
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              const move: Move = {
                from: { row, col },
                to: { row: toRow, col: toCol }
              };
              if (isValidMove(board, move)) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
}

export function isCastlingMove(board: Board, move: Move): boolean {
    const piece = board[move.from.row][move.from.col];
    if (!piece || piece.type !== 'king') return false;
  
    const colDiff = move.to.col - move.from.col;
    return Math.abs(colDiff) === 2;
}

export function isValidCastling(board: Board, move: Move): boolean {
    const piece = board[move.from.row][move.from.col];
    if (!piece || piece.type !== 'king') return false;
  
    const colDiff = move.to.col - move.from.col;
    if (Math.abs(colDiff) !== 2) return false;
  
    const row = move.from.row;
    const rookCol = colDiff > 0 ? 7 : 0;
    const rookPiece = board[row][rookCol];
  
    if (!rookPiece || rookPiece.type !== 'rook' || rookPiece.color !== piece.color) return false;
  
    // Check if there are pieces between king and rook
    const direction = colDiff > 0 ? 1 : -1;
    for (let col = move.from.col + direction; col !== rookCol; col += direction) {
      if (board[row][col]) return false;
    }
  
    // Check if the king is in check or passes through check
    for (let col = move.from.col; col !== move.to.col; col += direction) {
      if (isInCheck(board, piece.color)) return false;
      const tempBoard = board.map(row => [...row]);
      tempBoard[row][col] = piece;
      tempBoard[row][move.from.col] = null;
      if (isInCheck(tempBoard, piece.color)) return false;
    }
  
    return true;
}

export function isEnPassantMove(board: Board, move: Move, lastMove: Move | null): boolean {
    const piece = board[move.from.row][move.from.col];
    if (!piece || piece.type !== 'pawn') return false;

    const colDiff = Math.abs(move.to.col - move.from.col);
    const rowDiff = move.to.row - move.from.row;

    if (colDiff !== 1 || Math.abs(rowDiff) !== 1) return false;

    if (!lastMove || lastMove.to.col !== move.to.col) return false;

    const lastMovePiece = board[lastMove.to.row][lastMove.to.col];
    if (!lastMovePiece || lastMovePiece.type !== 'pawn') return false;

    const lastMoveRowDiff = Math.abs(lastMove.to.row - lastMove.from.row);

    return lastMoveRowDiff === 2 && lastMove.to.row === move.from.row;
}

export function isPawnPromotion(board: Board, move: Move): boolean {
    const piece = board[move.from.row][move.from.col];
    if (!piece || piece.type !== 'pawn') return false;

    return (piece.color === 'white' && move.to.row === 0) ||
        (piece.color === 'black' && move.to.row === 7);
}

export function isValidMove(board: Board, move: Move, lastMove: Move | null = null): boolean {
    const piece = board[move.from.row][move.from.col];
    if (!piece) return false;
  
    if (isCastlingMove(board, move)) {
      return isValidCastling(board, move);
    }
  
    if (isEnPassantMove(board, move, lastMove)) {
      return true;
    }
  
    const isValidForPiece = pieceSpecificValidation(board, move, piece);
    if (!isValidForPiece) return false;
  
    // Check if the move would put the current player in check
    const simulatedBoard = simulateMove(board, move);
    return !isInCheck(simulatedBoard, piece.color);
}

function pieceSpecificValidation(board: Board, move: Move, piece: Piece): boolean {
    switch (piece.type) {
        case 'pawn':
        return isValidPawnMove(board, move, piece.color);
        case 'rook':
        return isValidRookMove(board, move);
        case 'knight':
        return isValidKnightMove(move);
        case 'bishop':
        return isValidBishopMove(board, move);
        case 'queen':
        return isValidQueenMove(board, move);
        case 'king':
        return isValidKingMove(board, move);
        default:
        return false;
    }
}

// Implement specific move validations for each piece type
function isValidPawnMove(board: Board, move: Move, color: 'white' | 'black'): boolean {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    // Regular move
    if (move.from.col === move.to.col && move.to.row === move.from.row + direction && !board[move.to.row][move.to.col]) {
        return true;
    }

    // Initial double move
    if (move.from.col === move.to.col && move.from.row === startRow && move.to.row === move.from.row + 2 * direction &&
        !board[move.from.row + direction][move.to.col] && !board[move.to.row][move.to.col]) {
        return true;
    }

    // Capture
    if (Math.abs(move.from.col - move.to.col) === 1 && move.to.row === move.from.row + direction) {
        const targetPiece = board[move.to.row][move.to.col];
        return !!targetPiece && targetPiece.color !== color;
    }

    return false;
}

function isValidRookMove(board: Board, move: Move): boolean {
    if (move.from.row !== move.to.row && move.from.col !== move.to.col) return false;
    return !hasObstaclesBetween(board, move);
}

function isValidKnightMove(move: Move): boolean {
    const rowDiff = Math.abs(move.to.row - move.from.row);
    const colDiff = Math.abs(move.to.col - move.from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(board: Board, move: Move): boolean {
    if (Math.abs(move.to.row - move.from.row) !== Math.abs(move.to.col - move.from.col)) return false;
    return !hasObstaclesBetween(board, move);
}

function isValidQueenMove(board: Board, move: Move): boolean {
    return isValidRookMove(board, move) || isValidBishopMove(board, move);
}

function isValidKingMove(board: Board, move: Move): boolean {
    const rowDiff = Math.abs(move.to.row - move.from.row);
    const colDiff = Math.abs(move.to.col - move.from.col);
    return rowDiff <= 1 && colDiff <= 1;
}

function hasObstaclesBetween(board: Board, move: Move): boolean {
    const rowStep = Math.sign(move.to.row - move.from.row);
    const colStep = Math.sign(move.to.col - move.from.col);
    let row = move.from.row + rowStep;
    let col = move.from.col + colStep;

    while (row !== move.to.row || col !== move.to.col) {
        if (board[row][col]) return true;
        row += rowStep;
        col += colStep;
    }

    return false;
}

function simulateMove(board: Board, move: Move): Board {
    const newBoard = board.map(row => [...row]);
    newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
    newBoard[move.from.row][move.from.col] = null;
    return newBoard;
}

export function isInCheck(board: Board, color: 'white' | 'black'): boolean {
    const kingPosition = findKing(board, color);
    if (!kingPosition) return false;

    return board.some((row, rowIndex) =>
        row.some((piece, colIndex) => {
        if (piece && piece.color !== color) {
            const move: Move = {
            from: { row: rowIndex, col: colIndex },
            to: kingPosition
            };
            return pieceSpecificValidation(board, move, piece);
        }
        return false;
        })
    );
}

function findKing(board: Board, color: 'white' | 'black'): Position | null {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
            return { row, col };
        }
        }
    }
    return null;
}