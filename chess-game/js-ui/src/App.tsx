import React, { useState } from 'react';
import Chessboard from './components/Chessboard';
import { PieceColor } from './types/chess';

const App: React.FC = () => {
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');

  const handleTurnChange = (player: PieceColor) => {
    setCurrentPlayer(player);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="mb-4 text-xl font-bold">
        Current Turn: {currentPlayer === 'white' ? 'White' : 'Black'}
      </div>
      <Chessboard onTurnChange={handleTurnChange} />
    </div>
  );
};

export default App;