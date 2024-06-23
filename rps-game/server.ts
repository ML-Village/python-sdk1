import { WebSocketServer } from 'ws';
import http from 'http';
import { fork } from 'child_process';

const server = http.createServer();
const wss = new WebSocketServer({ server });

const gameProcess = fork('gameLogic.ts', [], { 
    execArgv: ['--loader', 'tsx']
});

gameProcess.on('message', (data: string) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocketServer.OPEN) {
        client.send(data);
        }
    });
});

wss.on('connection', (ws) => {
    ws.on('message', (message: string) => {
        gameProcess.send(message);
    });
});

server.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});