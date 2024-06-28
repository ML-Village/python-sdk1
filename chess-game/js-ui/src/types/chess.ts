// types/chess.ts
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type Square = Piece | null;

export type Board = Square[][];

export interface Position {
  row: number;
  col: number;
}

export type Move = {
  from: Position;
  to: Position;
};