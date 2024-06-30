import express from 'express';
import http from 'http';
import WebSocket from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

interface GameState {
  redMousePosition: [number, number];
  blueMousePosition: [number, number];
  cheesePosition: [number, number];
  currentPlayer: 'red' | 'blue';
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  possibleMoves: string[];
}

function calculatePossibleMoves(position: [number, number]): string[] {
  const [row, col] = position;
  const moves: string[] = [];

  if (row > 0) moves.push('up');
  if (row < 4) moves.push('down');
  if (col > 0) moves.push('left');
  if (col < 4) moves.push('right');

  return moves;
}

function getRandomPosition(): [number, number] {
  return [Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)];
}

const initialRedPosition: [number, number] = [0, 0];
const initialBluePosition: [number, number] = [4, 4];

let gameState: GameState = {
  redMousePosition: initialRedPosition,
  blueMousePosition: initialBluePosition,
  cheesePosition: getRandomPosition(),
  currentPlayer: 'red',
  gameOver: false,
  winner: null,
  possibleMoves: calculatePossibleMoves(initialRedPosition)
};

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.send(JSON.stringify(gameState));

  ws.on('message', (message: string) => {
    const data = JSON.parse(message);
    
    if (data.type === 'START_GAME') {
      gameState = {
        redMousePosition: initialRedPosition,
        blueMousePosition: initialBluePosition,
        cheesePosition: getRandomPosition(),
        currentPlayer: 'red',
        gameOver: false,
        winner: null,
        possibleMoves: calculatePossibleMoves(initialRedPosition)
      };
    } else if (data.type === 'MOVE') {
      const { player, direction } = data;
      if (player === gameState.currentPlayer && !gameState.gameOver) {
        const currentPosition = player === 'red' ? gameState.redMousePosition : gameState.blueMousePosition;
        let newPosition: [number, number] = [...currentPosition];

        switch (direction) {
          case 'up': newPosition[0] = Math.max(0, newPosition[0] - 1); break;
          case 'down': newPosition[0] = Math.min(4, newPosition[0] + 1); break;
          case 'left': newPosition[1] = Math.max(0, newPosition[1] - 1); break;
          case 'right': newPosition[1] = Math.min(4, newPosition[1] + 1); break;
        }

        if (player === 'red') {
          gameState.redMousePosition = newPosition;
        } else {
          gameState.blueMousePosition = newPosition;
        }

        if (newPosition[0] === gameState.cheesePosition[0] && newPosition[1] === gameState.cheesePosition[1]) {
          gameState.gameOver = true;
          gameState.winner = player;
          gameState.possibleMoves = [];
        } else {
          gameState.currentPlayer = gameState.currentPlayer === 'red' ? 'blue' : 'red';
          const nextPosition = gameState.currentPlayer === 'red' ? gameState.redMousePosition : gameState.blueMousePosition;
          gameState.possibleMoves = calculatePossibleMoves(nextPosition);
        }
      }
    }

    broadcastGameState();
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcastGameState() {
  const stateJson = JSON.stringify(gameState);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(stateJson);
      console.log(stateJson);
    }
  });
}

const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});