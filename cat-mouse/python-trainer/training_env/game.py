from logging import Logger
from typing import Any, Dict, List, Optional, Union
from .abstract_game import AbstractGame
from .move import Move

class Game(AbstractGame):
    
    def __init__(
        self,
        game_tag: str,
        username: str,
        logger: Logger,
        #gen: int,
        #save_replays: Union[str, bool] = False,
    ):
        super(Game, self).__init__(
            game_tag, 
            username, 
            logger, 
            # save_replays, 
            # gen
        )
        # Turn choice attributes
        self._available_moves: List[Move] = []
    
    @property
    def available_moves(self) -> List[Move]:
        """
        :return: The list of moves the player can use during the current move request.
        :rtype: List[Move]
        """
        return self._available_moves
    
    def parse_request(self, request: Dict[str, Any]) -> None:
        #for updating object from a request
        print("parsing requests in Game object...")
