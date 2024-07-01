"""This module defines a random players baseline
"""

from .abstract_game import AbstractGame
from .game_order import GameOrder
from .basicPlayer import BasicPlayer


class RandomPlayer(BasicPlayer):
    def choose_move(self, game: AbstractGame) -> GameOrder:
        print("choose random move")
        return self.choose_random_move(game)
