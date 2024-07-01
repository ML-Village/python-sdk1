import asyncio

from training_env.account_configuration import AccountConfiguration
from training_env.server_configuration import LocalhostServerConfiguration
from training_env.player import RandomPlayer


async def main():
		# We create a random player
		player = RandomPlayer(
			account_configuration=AccountConfiguration("bot_username", None),
			server_configuration=LocalhostServerConfiguration,
		)

		print("hellos")
		# Sending challenges to 'your_username'
		await player.send_challenges("0xhatsume", n_challenges=1)

		# Accepting one challenge from any user
		# await player.accept_challenges(None, 1)

		# Accepting three challenges from 'your_username'
		# await player.accept_challenges('your_username', 3)

		# Playing 5 games on the ladder
		# await player.ladder(5)

		# Print the rating of the player and its opponent after each battle
		# for game in player.games.values():
		# 	print(game)


if __name__ == "__main__":
	asyncio.get_event_loop().run_until_complete(main())