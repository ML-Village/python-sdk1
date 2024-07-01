from dataclasses import dataclass
from typing import Any, List, Optional, Union
import json
from .move import Move


@dataclass
class GameOrder:
    #order: Optional[Union[Move, Pokemon]]
    order: Optional[Move]
    # mega: bool = False
    # z_move: bool = False
    # dynamax: bool = False
    # terastallize: bool = False
    # move_target: int = DoubleBattle.EMPTY_TARGET_POSITION

    DEFAULT_ORDER = "/choose default"

    def __str__(self) -> str:
        return self.message

    @property
    def message(self) -> str:
        # if isinstance(self.order, Move):
        #     # if self.order.id == "recharge":
        #     #     return "/choose move 1"

        #     # message = f"/choose move {self.order.id}"
        #     # if self.mega:
        #     #     message += " mega"
        #     # elif self.z_move:
        #     #     message += " zmove"
        #     # elif self.dynamax:
        #     #     message += " dynamax"
        #     # elif self.terastallize:
        #     #     message += " terastallize"

        #     # if self.move_target != DoubleBattle.EMPTY_TARGET_POSITION:
        #     #     message += f" {self.move_target}"
        #     return message
        # elif isinstance(self.order, Pokemon):
        #     return f"/choose switch {self.order.species}"
        # else:
        #     return ""

        return json.dumps({
                    "type": 'MOVE',
                    "player": 'blue',
                    "direction": self.order
                })




class DefaultGameOrder(GameOrder):
    def __init__(self, *args: Any, **kwargs: Any):
        pass

    @property
    def message(self) -> str:
        return json.dumps({
                    "type": 'MOVE',
                    "player": 'blue',
                    "direction": 'up'
                })