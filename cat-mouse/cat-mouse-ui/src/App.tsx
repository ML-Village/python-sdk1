import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import StatusDisplay from './components/StatusDisplay';

const App: React.FC = () => {
  const [boardSize] = useState(5);
  const [redMousePosition, setRedMousePosition] = useState<[number, number]>([0, 0]);
  const [blueMousePosition, setBlueMousePosition] = useState<[number, number]>([4, 4]);
  const [cheesePosition, setCheesePosition] = useState<[number, number]>([2, 2]);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'blue'>('red');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'red' | 'blue' | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setRedMousePosition([0, 0]);
    setBlueMousePosition([4, 4]);
    setCheesePosition(getRandomPosition());
    setCurrentPlayer('red');
    setGameOver(false);
    setWinner(null);
    setGameStarted(true);
  };

  const getRandomPosition = (): [number, number] => {
    return [Math.floor(Math.random() * boardSize), Math.floor(Math.random() * boardSize)];
  };

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || !gameStarted) return;

    const currentPosition = currentPlayer === 'red' ? redMousePosition : blueMousePosition;
    let newPosition: [number, number] = [...currentPosition];

    switch (direction) {
      case 'up': newPosition[0] = Math.max(0, newPosition[0] - 1); break;
      case 'down': newPosition[0] = Math.min(boardSize - 1, newPosition[0] + 1); break;
      case 'left': newPosition[1] = Math.max(0, newPosition[1] - 1); break;
      case 'right': newPosition[1] = Math.min(boardSize - 1, newPosition[1] + 1); break;
    }

    if (currentPlayer === 'red') {
      setRedMousePosition(newPosition);
    } else {
      setBlueMousePosition(newPosition);
    }

    if (newPosition[0] === cheesePosition[0] && newPosition[1] === cheesePosition[1]) {
      setGameOver(true);
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer(currentPlayer === 'red' ? 'blue' : 'red');
    }
  }, [currentPlayer, redMousePosition, blueMousePosition, cheesePosition, boardSize, gameOver, gameStarted]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': movePlayer('up'); break;
        case 'ArrowDown': movePlayer('down'); break;
        case 'ArrowLeft': movePlayer('left'); break;
        case 'ArrowRight': movePlayer('right'); break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Two Mice, One Cheese</h1>
      {!gameStarted ? (
        <button 
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={startGame}
        >
          Start Game
        </button>
      ) : (
        <>
          <GameBoard 
            boardSize={boardSize} 
            redMousePosition={redMousePosition}
            blueMousePosition={blueMousePosition}
            cheesePosition={cheesePosition}
            currentPlayer={currentPlayer}
          />
          <StatusDisplay
            redMousePosition={redMousePosition}
            blueMousePosition={blueMousePosition}
            cheesePosition={cheesePosition}
            currentPlayer={currentPlayer}
          />
          <div className="mt-4 text-xl">
            {gameOver 
              ? `Game Over! ${winner?.toUpperCase()} mouse wins!` 
              : `Current player: ${currentPlayer.toUpperCase()} mouse`}
          </div>
          {gameOver && (
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={startGame}
            >
              Play Again
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default App;