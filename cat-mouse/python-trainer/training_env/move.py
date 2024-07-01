import copy
from functools import lru_cache
from typing import Any, Dict, List, Optional, Set, Tuple, Union

class Move:
    _MISC_FLAGS = [
        "onModifyMove",
        "onEffectiveness",
        "onHitField",
        "onAfterMoveSecondarySelf",
        "onHit",
        "onTry",
        "beforeTurnCallback",
        "onAfterMove",
        "onTryHit",
        "onTryMove",
        "hasCustomRecoil",
        "onMoveFail",
        "onPrepareHit",
        "onAfterHit",
        "onBasePower",
        "basePowerCallback",
        "damageCallback",
        "onTryHitSide",
        "beforeMoveCallback",
    ]

    # _MOVE_CATEGORY_PER_TYPE_PRE_SPLIT = {
    #     PokemonType.BUG: MoveCategory.PHYSICAL,
    #     PokemonType.DARK: MoveCategory.SPECIAL,
    #     PokemonType.DRAGON: MoveCategory.SPECIAL,
    #     PokemonType.ELECTRIC: MoveCategory.SPECIAL,
    #     PokemonType.FIGHTING: MoveCategory.PHYSICAL,
    #     PokemonType.FIRE: MoveCategory.SPECIAL,
    #     PokemonType.FLYING: MoveCategory.PHYSICAL,
    #     PokemonType.GHOST: MoveCategory.PHYSICAL,
    #     PokemonType.GRASS: MoveCategory.SPECIAL,
    #     PokemonType.GROUND: MoveCategory.PHYSICAL,
    #     PokemonType.ICE: MoveCategory.SPECIAL,
    #     PokemonType.NORMAL: MoveCategory.PHYSICAL,
    #     PokemonType.POISON: MoveCategory.PHYSICAL,
    #     PokemonType.PSYCHIC: MoveCategory.SPECIAL,
    #     PokemonType.ROCK: MoveCategory.PHYSICAL,
    #     PokemonType.STEEL: MoveCategory.PHYSICAL,
    #     PokemonType.WATER: MoveCategory.SPECIAL,
    # }

    __slots__ = (
        "_id",
        # "_base_power_override",
        # "_current_pp",
        # "_dynamaxed_move",
        # "_gen",
        "_is_empty",
        # "_moves_dict",
        # "_request_target",
    )

    def __init__(self, move_id: str, gen: int, raw_id: Optional[str] = None):
        self._id = move_id
        # self._base_power_override = None
        # self._gen = gen
        # self._moves_dict = GenData.from_gen(gen).moves

        # if move_id.startswith("hiddenpower") and raw_id is not None:
        #     base_power = "".join([c for c in raw_id if c.isdigit()])
        #     self._id = "".join([c for c in to_id_str(raw_id) if not c.isdigit()])

        #     if base_power:
        #         try:
        #             base_power = int(base_power)
        #             self._base_power_override = base_power
        #         except ValueError:
        #             pass

        # self._current_pp = self.max_pp
        self._is_empty: bool = False

        # self._dynamaxed_move = None
        # self._request_target = None

    def __repr__(self) -> str:
        return f"{self._id} (Move object)"


    @property
    def id(self) -> str:
        """
        :return: Move id.
        :rtype: str
        """
        return self._id

        """
        :return: Base power of the z-move version of this move.
        :rtype: int
        """
        if "zMove" in self.entry and "basePower" in self.entry["zMove"]:
            return self.entry["zMove"]["basePower"]
        elif self.category == MoveCategory.STATUS:
            return 0
        base_power = self.base_power
        if self.n_hit != (1, 1):
            base_power *= 3
        elif base_power <= 55:
            return 100
        elif base_power <= 65:
            return 120
        elif base_power <= 75:
            return 140
        elif base_power <= 85:
            return 160
        elif base_power <= 95:
            return 175
        elif base_power <= 100:
            return 180
        elif base_power <= 110:
            return 185
        elif base_power <= 125:
            return 190
        elif base_power <= 130:
            return 195
        return 200

class EmptyMove(Move):
    def __init__(self, move_id: str):
        self._id = move_id
        self._is_empty: bool = True

    def __getattribute__(self, name: str):
        try:
            return super(Move, self).__getattribute__(name)
        except (AttributeError, TypeError, ValueError):
            return 0

    def __deepcopy__(self, memodict: Optional[Dict[int, Any]] = {}):
        return EmptyMove(copy.deepcopy(self._id, memodict))
