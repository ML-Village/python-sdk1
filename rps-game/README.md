### Rock Paper Scissor Game

A game to simulate runninga http server and publish streams of messages to run a game. Game should be able to be interacted by message streams via IO. Vite front-end reflects game state via UI. Python client simulates external interaction via websocket messages.

###### Installation
Usual npm or pnpm in server and vite folder.
Python requires Python >= 3.10. Python dependencies are:
`pip3 install -r requirements.txt`

Start by running server in "server" folder with:
`node server.js`

Then start UI in vite folder with:
`pnpm dev`

Then run python client sim in python folder with:
`python3 client.py`