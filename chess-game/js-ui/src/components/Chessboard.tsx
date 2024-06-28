import React, { useState } from 'react';
import { Board, Position, PieceColor, Move, Piece } from '../types/chess';
import Square from './Square';
import { isValidMove, isInCheck, isCheckmate, isPawnPromotion } from '../utils/chessLogic';

interface ChessboardProps {
  onTurnChange: (player: PieceColor) => void;
}

const Chessboard: React.FC<ChessboardProps> = ({ onTurnChange }) => {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'stalemate'>('playing');

  const handleSquareClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;

    if (selectedPosition) {
      const move: Move = {
        from: selectedPosition,
        to: { row, col },
      };
      
      if (isValidMove(board, move, lastMove)) {
        makeMove(move);
        setSelectedPosition(null);
      } else {
        setSelectedPosition(null);
      }
    } else {
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        setSelectedPosition({ row, col });
      }
    }
  };

  const makeMove = (move: Move) => {
    let newBoard = board.map(row => [...row]);
    const piece = newBoard[move.from.row][move.from.col];
    newBoard[move.to.row][move.to.col] = piece;
    newBoard[move.from.row][move.from.col] = null;

    // Handle en passant capture
    if (piece?.type === 'pawn' && move.from.col !== move.to.col && !newBoard[move.to.row][move.to.col]) {
      newBoard[move.from.row][move.to.col] = null;
    }

    // Handle pawn promotion
    if (isPawnPromotion(board, move)) {
      newBoard[move.to.row][move.to.col] = { type: 'queen', color: piece!.color };
    }

    setBoard(newBoard);
    setLastMove(move);

    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
    setCurrentPlayer(nextPlayer);
    onTurnChange(nextPlayer);

    const inCheck = isInCheck(newBoard, nextPlayer);
    setIsCheck(inCheck);

    if (inCheck && isCheckmate(newBoard, nextPlayer)) {
      setGameStatus('checkmate');
    } else if (!inCheck && isCheckmate(newBoard, nextPlayer)) {
      setGameStatus('stalemate');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-8 w-96 h-96 border border-gray-800">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <Square
              key={`${rowIndex}-${colIndex}`}
              piece={piece}
              isLight={(rowIndex + colIndex) % 2 === 0}
              isSelected={selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
      {isCheck && gameStatus === 'playing' && <div className="mt-4 text-red-600 font-bold">Check!</div>}
      {gameStatus === 'checkmate' && <div className="mt-4 text-red-600 font-bold">Checkmate! {currentPlayer === 'white' ? 'Black' : 'White'} wins!</div>}
      {gameStatus === 'stalemate' && <div className="mt-4 text-blue-600 font-bold">Stalemate! The game is a draw.</div>}
    </div>
  );
};

// Define the initializeBoard function within the same file
function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
    // Add pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black' };
      board[6][i] = { type: 'pawn', color: 'white' };
    }
  
    // Add rooks
    board[0][0] = board[0][7] = { type: 'rook', color: 'black' };
    board[7][0] = board[7][7] = { type: 'rook', color: 'white' };
  
    // Add knights
    board[0][1] = board[0][6] = { type: 'knight', color: 'black' };
    board[7][1] = board[7][6] = { type: 'knight', color: 'white' };
  
    // Add bishops
    board[0][2] = board[0][5] = { type: 'bishop', color: 'black' };
    board[7][2] = board[7][5] = { type: 'bishop', color: 'white' };
  
    // Add queens
    board[0][3] = { type: 'queen', color: 'black' };
    board[7][3] = { type: 'queen', color: 'white' };
  
    // Add kings
    board[0][4] = { type: 'king', color: 'black' };
    board[7][4] = { type: 'king', color: 'white' };
  
    return board;
}

export default Chessboard;