import React from 'react';
import { Square as SquareType } from '../types/chess';
import Piece from './Piece';

interface SquareProps {
    piece: SquareType;
    isLight: boolean;
    isSelected: boolean;
    onClick: () => void;
}

const Square: React.FC<SquareProps> = ({ piece, isLight, isSelected, onClick }) => {
    return (
        <div
        className={`w-12 h-12 flex items-center justify-center cursor-pointer
            ${isLight ? 'bg-gray-200' : 'bg-gray-600'}
            ${isSelected ? 'ring-2 ring-blue-500' : ''}
        `}
        onClick={onClick}
        >
        {piece && <Piece type={piece.type} color={piece.color} />}
        </div>
    );
};

export default Square;