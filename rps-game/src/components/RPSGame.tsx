import React, { useState, useEffect } from 'react';

type Choice = 'rock' | 'paper' | 'scissors';
type GameState = 'notStarted' | 'inProgress' | 'finished';

const RPSGame: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('notStarted');
    const [userScore, setUserScore] = useState(0);
    const [computerScore, setComputerScore] = useState(0);
    const [userChoice, setUserChoice] = useState<Choice | ''>('');
    const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
    const [result, setResult] = useState<string>('');

    const choices: Choice[] = ['rock', 'paper', 'scissors'];

    const getRandomChoice = (): Choice => {
        return choices[Math.floor(Math.random() * choices.length)];
    };

    const startGame = () => {
        setGameState('inProgress');
        setUserScore(0);
        setComputerScore(0);
        setResult('');
    };

    const playRound = () => {
    if (userChoice === '') return;

    const computerSelection = getRandomChoice();
    setComputerChoice(computerSelection);

    if (userChoice === computerSelection) {
        setResult("It's a tie!");
    } else if (
        (userChoice === 'rock' && computerSelection === 'scissors') ||
        (userChoice === 'paper' && computerSelection === 'rock') ||
        (userChoice === 'scissors' && computerSelection === 'paper')
    ) {
        setResult('You win this round!');
        setUserScore(prevScore => prevScore + 1);
    } else {
        setResult('Computer wins this round!');
        setComputerScore(prevScore => prevScore + 1);
    }

    setUserChoice('');
    };

    useEffect(() => {
    if (userScore === 3 || computerScore === 3) {
        setGameState('finished');
    }
    }, [userScore, computerScore]);

    return (
    <div>
        <h1>Rock Paper Scissors</h1>
        {gameState === 'notStarted' && (
        <button onClick={startGame}>Start Game</button>
        )}
        {gameState === 'inProgress' && (
        <div>
            <p>Score - You: {userScore} Computer: {computerScore}</p>
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
            {result && <p>{result}</p>}
            {computerChoice && <p>Computer chose: {computerChoice}</p>}
        </div>
        )}
        {gameState === 'finished' && (
        <div>
            <p>Game Over!</p>
            <p>{userScore > computerScore ? 'You win!' : 'Computer wins!'}</p>
            <button onClick={startGame}>Play Again</button>
        </div>
        )}
    </div>
    );
};

export default RPSGame;