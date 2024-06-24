import React, { useState, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './App.css';

interface GameScore {
  player: number;
  computer: number;
}

interface GameMove {
  player: string;
  computer: string;
}

const emojiMap: { [key: string]: string } = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
};

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState<GameScore>({ player: 0, computer: 0 });
  const [gameHistory, setGameHistory] = useState<GameMove[]>([]);

  const socketUrl = 'ws://localhost:3000';
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    if (lastMessage !== null) {
      console.log('Received message:', lastMessage.data);
      
      const lines = lastMessage.data.split('\n');
      let playerChoice = '';
      let computerChoice = '';

      lines.forEach(line => {
        if (line.startsWith('Player chose:')) {
          playerChoice = line.split(':')[1].trim().toLowerCase();
        } else if (line.startsWith('Computer chose:')) {
          computerChoice = line.split(':')[1].trim().toLowerCase();
        } else if (line.startsWith('Score:')) {
          const [playerScore, computerScore] = line.match(/\d+/g)!.map(Number);
          setScore({ player: playerScore, computer: computerScore });
        }
      });

      if (playerChoice && computerChoice) {
        setGameHistory(prev => [...prev, { player: playerChoice, computer: computerChoice }]);
      }

      if (lastMessage.data.includes('Game Over')) {
        setGameStarted(false);
      }
    }
  }, [lastMessage]);

  const startGame = useCallback(() => {
    sendMessage(JSON.stringify({ action: 'start' }));
    setGameStarted(true);
    setScore({ player: 0, computer: 0 });
    setGameHistory([]);
  }, [sendMessage]);

  const playChoice = useCallback((choice: string) => {
    sendMessage(JSON.stringify({ action: 'play', choice }));
  }, [sendMessage]);

  return (
    <div className="App">
      <h1>Rock Paper Scissors</h1>
      <p>The WebSocket is currently {connectionStatus}</p>
      {!gameStarted && (
        <button onClick={startGame} disabled={readyState !== ReadyState.OPEN}>Start Game</button>
      )}
      {gameStarted && (
        <div>
          <button onClick={() => playChoice('rock')} disabled={readyState !== ReadyState.OPEN}>Rock 🪨</button>
          <button onClick={() => playChoice('paper')} disabled={readyState !== ReadyState.OPEN}>Paper 📄</button>
          <button onClick={() => playChoice('scissors')} disabled={readyState !== ReadyState.OPEN}>Scissors ✂️</button>
        </div>
      )}
      <h2>Score</h2>
      <p>Player: {score.player} - Computer: {score.computer}</p>
      <h2>Game History</h2>
      <ul>
        {gameHistory.map((move, index) => (
          <li key={index}>
            Round {index + 1}: Player {emojiMap[move.player]} vs Computer {emojiMap[move.computer]}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;