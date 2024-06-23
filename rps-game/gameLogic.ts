import { Choice, GameState, GameData, Command } from './types';

let gameState: GameState = 'notStarted';
let userScore = 0;
let computerScore = 0;

const choices: Choice[] = ['rock', 'paper', 'scissors'];

function getRandomChoice(): Choice {
  return choices[Math.floor(Math.random() * choices.length)];
}

function playRound(userChoice: Choice) {
    const computerChoice = getRandomChoice();
    let result: string;

    if (userChoice === computerChoice) {
        result = "It's a tie!";
    } else if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        result = 'You win this round!';
        userScore++;
    } else {
        result = 'Computer wins this round!';
        computerScore++;
    }

    const gameData: GameData = { gameState, userScore, computerScore, userChoice, computerChoice, result };
    process.send!(JSON.stringify(gameData));

    if (userScore === 3 || computerScore === 3) {
        gameState = 'finished';
        const finalData: GameData = { gameState, winner: userScore > computerScore ? 'user' : 'computer' };
        process.send!(JSON.stringify(finalData));
    }
}

process.on('message', (input: string) => {
    const command: Command = JSON.parse(input);

    if (command.action === 'start') {
        gameState = 'inProgress';
        userScore = 0;
        computerScore = 0;
        const gameData: GameData = { gameState, userScore, computerScore };
        process.send!(JSON.stringify(gameData));
    } else if (command.action === 'play' && gameState === 'inProgress' && command.choice) {
        playRound(command.choice);
    }
});