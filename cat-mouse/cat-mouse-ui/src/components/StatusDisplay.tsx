import React from 'react';

interface StatusDisplayProps {
    redMousePosition: [number, number];
    blueMousePosition: [number, number];
    cheesePosition: [number, number];
    currentPlayer: 'red' | 'blue';
    possibleMoves: string[];
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
    redMousePosition,
    blueMousePosition,
    cheesePosition,
    currentPlayer,
    possibleMoves
    }) => {
    return (
        <div className="mt-4 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">Game Status</h2>
        <p className="text-red-500">Red Mouse: ({redMousePosition[0]}, {redMousePosition[1]})</p>
        <p className="text-blue-500">Blue Mouse: ({blueMousePosition[0]}, {blueMousePosition[1]})</p>
        <p className="text-yellow-500">Cheese: ({cheesePosition[0]}, {cheesePosition[1]})</p>
        <p className="mt-2 font-semibold">Current Turn: <span className={`text-${currentPlayer}-500`}>{currentPlayer.toUpperCase()} Mouse</span></p>
        <p className="mt-2">Possible Moves: {possibleMoves.join(', ')}</p>
        </div>
    );
};

export default StatusDisplay;