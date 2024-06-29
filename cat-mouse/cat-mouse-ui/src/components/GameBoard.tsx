import React from 'react';
import Mouse from './Mouse';
import Cheese from './Cheese';

interface GameBoardProps {
  boardSize: number;
  redMousePosition: [number, number];
  blueMousePosition: [number, number];
  cheesePosition: [number, number];
  currentPlayer: 'red' | 'blue';
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  boardSize, 
  redMousePosition, 
  blueMousePosition, 
  cheesePosition,
  currentPlayer
}) => {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}>
      {Array.from({ length: boardSize * boardSize }).map((_, index) => {
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;
        return (
          <div key={index} className={`w-12 h-12 ${currentPlayer === 'red' ? 'bg-red-100' : 'bg-blue-100'} flex items-center justify-center`}>
            {row === redMousePosition[0] && col === redMousePosition[1] && <Mouse color="red" />}
            {row === blueMousePosition[0] && col === blueMousePosition[1] && <Mouse color="blue" />}
            {row === cheesePosition[0] && col === cheesePosition[1] && <Cheese />}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;