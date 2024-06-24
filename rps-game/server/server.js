import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let gameInProgress = false;
let playerScore = 0;
let computerScore = 0;
let roundsPlayed = 0;

function broadcastMessage(message) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
            console.log(message)
        }
    });
}

function getComputerChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
}

function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) return 'tie';
    if (
        (playerChoice === 'rock' && computerChoice === 'scissors') ||
        (playerChoice === 'paper' && computerChoice === 'rock') ||
        (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
        return 'player';
    }
    return 'computer';
}

function processGame(playerChoice) {
    const computerChoice = getComputerChoice();
    const result = determineWinner(playerChoice, computerChoice);

    let output = '';
    output += `Player chose: ${playerChoice}\n`;
    output += `Computer chose: ${computerChoice}\n`;

    if (result === 'tie') {
        output += 'It\'s a tie!\n';
    } else if (result === 'player') {
        playerScore++;
        output += 'Player wins this round!\n';
    } else {
        computerScore++;
        output += 'Computer wins this round!\n';
    }

    roundsPlayed++;

    output += `Score: Player ${playerScore} - Computer ${computerScore}\n`;

    if (roundsPlayed === 5 || playerScore === 3 || computerScore === 3) {
        if (playerScore > computerScore) {
        output += 'Player wins the game!\n';
        } else if (computerScore > playerScore) {
        output += 'Computer wins the game!\n';
        } else {
        output += 'The game is a tie!\n';
        }
        gameInProgress = false;
        output += 'Game Over\n';
    }

    return output;
}

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.action === 'start') {
        if (!gameInProgress) {
            gameInProgress = true;
            playerScore = 0;
            computerScore = 0;
            roundsPlayed = 0;
            broadcastMessage('New game started');
        } else {
            ws.send('Game already in progress');
            console.log('Game already in progress')
        }
        } else if (data.action === 'play') {
        const choice = data.choice.toLowerCase();
        if (gameInProgress && ['rock', 'paper', 'scissors'].includes(choice)) {
            const response = processGame(choice);
            broadcastMessage(response);
        } else if (!gameInProgress) {
            ws.send('No game in progress. Please start a new game.');
            console.log('No game in progress. Please start a new game.')
        } else {
            ws.send('Invalid choice. Please choose rock, paper, or scissors.');
            console.log('Invalid choice. Please choose rock, paper, or scissors.')
        }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(port, () => {
    console.log(`Game server is running on http://localhost:${port}`);
});