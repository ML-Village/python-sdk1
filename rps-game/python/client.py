import asyncio
import websockets
import json
import random

async def play_game():
    uri = "ws://localhost:3000"
    async with websockets.connect(uri) as websocket:
        print("Connected to the game server")
        game_in_progress = False

        while True:
            try:
                message = await websocket.recv()
                print(f"Received: {message}")

                if "New game started" in message:
                    game_in_progress = True
                    print("A new game has started!")
                elif "Game Over" in message:
                    game_in_progress = False
                    print("The game has ended.")

                if game_in_progress and "Score:" in message:
                    # Prompt for next move
                    choice = await asyncio.get_event_loop().run_in_executor(
                        None, 
                        lambda: input("Enter your choice (rock/paper/scissors) or 'auto' for random choice: ").lower()
                    )
                    
                    if choice == 'auto':
                        choice = random.choice(['rock', 'paper', 'scissors'])
                        print(f"Auto-chosen: {choice}")

                    if choice in ['rock', 'paper', 'scissors']:
                        await websocket.send(json.dumps({"action": "play", "choice": choice}))
                    else:
                        print("Invalid choice. Please choose rock, paper, or scissors.")

            except websockets.exceptions.ConnectionClosed:
                print("Connection to the server was closed")
                break

asyncio.get_event_loop().run_until_complete(play_game())