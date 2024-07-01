import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import StatusDisplay from './components/StatusDisplay';

interface GameState {
  redMousePosition: [number, number];
  blueMousePosition: [number, number];
  cheesePosition: [number, number];
  currentPlayer: 'red' | 'blue';
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  possibleMoves: string[];
  gameTag: string; 
  gameIntent: string;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    redMousePosition: [0, 0],
    blueMousePosition: [4, 4],
    cheesePosition: [2, 2],
    currentPlayer: 'red',
    gameOver: false,
    winner: null,
    possibleMoves: [],
    gameTag: '8888',
    gameIntent: "none"
  });
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const newSocket = new WebSocket('ws://localhost:3000');
    
    newSocket.onopen = () => {
      console.log('Connected to server');
    };

    newSocket.onmessage = (event) => {
      //console.log(event.data);
      const newGameState = JSON.parse(event.data);
      setGameState(newGameState);
      console.log(newGameState);
      // console.log(newGameState.redMousePosition);
    };

    newSocket.onclose = () => {
      console.log('Disconnected from server');
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const startGame = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'START_GAME' }));
    }
  }, [socket]);

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (socket && socket.readyState === WebSocket.OPEN && !gameState.gameOver) {
      socket.send(JSON.stringify({
        type: 'MOVE',
        player: gameState.currentPlayer,
        direction
      }));
    }
  }, [socket, gameState.currentPlayer, gameState.gameOver]);

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
      <button 
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={startGame}
      >
        {gameState.gameOver ? 'Start New Game' : 'Restart Game'}
      </button>
      <GameBoard 
        boardSize={5} 
        redMousePosition={gameState.redMousePosition}
        blueMousePosition={gameState.blueMousePosition}
        cheesePosition={gameState.cheesePosition}
        currentPlayer={gameState.currentPlayer}
      />
      <StatusDisplay
        redMousePosition={gameState.redMousePosition}
        blueMousePosition={gameState.blueMousePosition}
        cheesePosition={gameState.cheesePosition}
        currentPlayer={gameState.currentPlayer}
        possibleMoves={gameState.possibleMoves}
        gameTag={gameState.gameTag}
      />
      <div className="mt-4 text-xl">
        {gameState.gameOver 
          ? `Game Over! ${gameState.winner?.toUpperCase()} mouse wins!` 
          : `Current player: ${gameState.currentPlayer.toUpperCase()} mouse`}
      </div>
    </div>
  );
};

export default App;