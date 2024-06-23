import React, { useState, useEffect, useRef } from 'react';

type Choice = 'rock' | 'paper' | 'scissors';
type GameState = 'notStarted' | 'inProgress' | 'finished';

interface GameData {
    gameState: GameState;
    userScore: number;
    computerScore: number;
    userChoice?: Choice;
    computerChoice?: Choice;
    result?: string;
    winner?: 'user' | 'computer';
}

const RPSGame: React.FC = () => {
    const [gameData, setGameData] = useState<GameData>({
        gameState: 'notStarted',
        userScore: 0,
        computerScore: 0,
    });
    const [userChoice, setUserChoice] = useState<Choice | ''>('');
    const wsRef = useRef<WebSocket | null>(null);

    const choices: Choice[] = ['rock', 'paper', 'scissors'];

    useEffect(() => {
        wsRef.current = new WebSocket('ws://localhost:8080');

        wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setGameData(prevData => ({ ...prevData, ...data }));
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const sendCommand = (action: string, choice?: Choice) => {
        if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ action, choice }));
        }
    };

    const startGame = () => {
        sendCommand('start');
    };

    const playRound = () => {
        if (userChoice) {
        sendCommand('play', userChoice);
        setUserChoice('');
        }
    };

    return (
        <div>
        <h1>Rock Paper Scissors</h1>
        {gameData.gameState === 'notStarted' && (
            <button onClick={startGame}>Start Game</button>
        )}
        {gameData.gameState === 'inProgress' && (
            <div>
            <p>Score - You: {gameData.userScore} Computer: {gameData.computerScore}</p>
            <select
                value={userChoice}
                onChange={(e) => setUserChoice(e.target.value as Choice)}
            >
                <option value="">Choose...</option>
                {choices.map(choice => (
                <option key={choice} value={choice}>{choice}</option>
                ))}
            </select>
            <button onClick={playRound} disabled={!userChoice}>Play</button>
            {gameData.result && <p>{gameData.result}</p>}
            {gameData.computerChoice && <p>Computer chose: {gameData.computerChoice}</p>}
            </div>
        )}
        {gameData.gameState === 'finished' && (
            <div>
            <p>Game Over!</p>
            <p>{gameData.winner === 'user' ? 'You win!' : 'Computer wins!'}</p>
            <button onClick={startGame}>Play Again</button>
            </div>
        )}
        </div>
    );
};

export default RPSGame;