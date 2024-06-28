import React from 'react';
import { PieceType, PieceColor } from '../types/chess';

interface PieceProps {
    type: PieceType;
    color: PieceColor;
}

const Piece: React.FC<PieceProps> = ({ type, color }) => {
    // You can use Unicode chess symbols or import SVG icons for pieces
    const pieceSymbols: Record<PieceType, string> = {
        pawn: '♟',
        rook: '♜',
        knight: '♞',
        bishop: '♝',
        queen: '♛',
        king: '♚',
};

    return (
        <span className={`text-3xl ${color === 'white' ? 'text-orange-400' : 'text-black'}`}>
        {pieceSymbols[type]}
        </span>
    );
};

export default Piece;