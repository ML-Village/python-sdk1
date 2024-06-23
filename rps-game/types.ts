export type Choice = 'rock' | 'paper' | 'scissors';
export type GameState = 'notStarted' | 'inProgress' | 'finished';

export interface GameData {
    gameState: GameState;
    userScore: number;
    computerScore: number;
    userChoice?: Choice;
    computerChoice?: Choice;
    result?: string;
    winner?: 'user' | 'computer';
}

export interface Command {
    action: 'start' | 'play';
    choice?: Choice;
}