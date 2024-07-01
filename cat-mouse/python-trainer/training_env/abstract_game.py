import os
from abc import ABC, abstractmethod
from logging import Logger
from typing import Any, Dict, List, Optional, Set, Tuple, Union


class AbstractGame(ABC):
    MESSAGES_TO_IGNORE = {
        "-anim",
        "-block",
        "-burst",
        "-center",
        "-combine",
        "-crit",
        "-fail",
        "-fieldactivate",
        "-hint",
        "-hitcount",
        "-miss",
        "-notarget",
        "-nothing",
        "-ohko",
        "-resisted",
        "-singlemove",
        "-singleturn",
        "-supereffective",
        "-waiting",
        "-zbroken",
        "J",
        "L",
        "askreg",
        "c",
        "chat",
        "crit",
        "debug",
        "deinit",
        "gametype",
        "gen",
        "html",
        "immune",
        "init",
        "j",
        "join",
        "l",
        "leave",
        "n",
        "name",
        "rated",
        "resisted",
        "split",
        "supereffective",
        "teampreview",
        "tier",
        "upkeep",
        "uhtml",
        "zbroken",
    }

    __slots__ = (
        "_anybody_inactive",
        "_available_moves",
        "_available_switches",
        "_game_tag",
        "_can_dynamax",
        "_can_mega_evolve",
        "_can_tera",
        "_can_z_move",
        "_current_observation",
        "_data",
        "_dynamax_turn",
        "_fields",
        "_finished",
        "_force_switch",
        "_format",
        "in_team_preview",
        "_max_team_size",
        "_maybe_trapped",
        "_move_on_next_request",
        "_observations",
        "_opponent_can_dynamax",
        "_opponent_can_mega_evolve",
        "_opponent_can_terrastallize",
        "_opponent_can_z_move",
        "_opponent_dynamax_turn",
        "_opponent_rating",
        "_opponent_side_conditions",
        "_opponent_team",
        "_opponent_username",
        "_player_role",
        "_player_username",
        "_players",
        "_rating",
        "_reconnected",
        "_replay_data",
        "_rqid",
        "rules",
        "_reviving",
        "_save_replays",
        "_side_conditions",
        "_team_size",
        "_team",
        "_teampreview_opponent_team",
        "_teampreview",
        "_trapped",
        "_turn",
        "_wait",
        "_weather",
        "_won",
        "logger",
    )

    def __init__(
        self,
        game_tag: str,
        username: str,
        logger: Logger,
        # save_replays: Union[str, bool],
        # gen: int,
    ):
        # Load data
        #self._data = GenData.from_gen(gen)

        # Utils attributes
        self._game_tag: str = game_tag
        print("GAME TAGGGGG game_tag IS: ", self._game_tag)
        self._format: Optional[str] = None
        self._max_team_size: Optional[int] = None
        self._opponent_username: Optional[str] = None
        self._player_role: Optional[str] = None
        self._player_username: str = username
        self._players: List[Dict[str, str]] = []
        #self._replay_data: List[List[str]] = []
        #self._save_replays: Union[str, bool] = save_replays
        self._team_size: Dict[str, int] = {}
        # self._teampreview: bool = False
        # self._teampreview_opponent_team: Set[Pokemon] = set()
        self._anybody_inactive: bool = False
        self._reconnected: bool = True
        self.logger: Optional[Logger] = logger

        # Turn choice attributes
        # self.in_team_preview: bool = False
        # self._move_on_next_request: bool = False
        self._wait: Optional[bool] = None

        # Battle state attributes
        # self._dynamax_turn: Optional[int] = None
        self._finished: bool = False
        self._rqid = 0
        # self.rules: List[str] = []
        self._turn: int = 0
        # self._opponent_can_terrastallize: bool = True
        # self._opponent_dynamax_turn: Optional[int] = None
        # self._opponent_rating: Optional[int] = None
        # self._rating: Optional[int] = None
        self._won: Optional[bool] = None

        # In game battle state attributes
        # self._weather: Dict[Weather, int] = {}
        # self._fields: Dict[Field, int] = {}  # set()
        # self._opponent_side_conditions: Dict[SideCondition, int] = {}  # set()
        # self._side_conditions: Dict[SideCondition, int] = {}  # set()
        self._reviving: bool = False

        # Pokemon attributes
        # self._team: Dict[str, Pokemon] = {}
        # self._opponent_team: Dict[str, Pokemon] = {}

        # Initialize Observations
        # self._observations: Dict[int, Observation] = {}
        # self._current_observation: Observation = Observation()

    # @abstractmethod
    # def clear_all_boosts(self):
    #     pass
    
    # @abstractmethod
    # def end_illusion(self, pokemon_name: str, details: str):
    #     pass

    def _finish_battle(self):
        # Recording the battle state and save events as we finish up
        
        # self.observations[self.turn] = self._current_observation
        # if self._save_replays:
        #     ...
        #     ...
        self._finished = True
    
    def parse_message(self, split_message: Dict[str, Any]):
        # is to assign message vars to self vars
        # also loggs "Observations"
        print("==========PARSING MESSAGE=====================")
        print(split_message)
        self._available_moves = split_message["possibleMoves"]



    @abstractmethod
    def parse_request(self, request: Dict[str, Any]):
        # externally used in upper class
        pass

    # @abstractmethod
    # def switch(self, pokemon_str: str, details: str, hp_status: str):
    #     pass
    
    def tied(self):
        self._finish_battle()

    def won_by(self, player_name: str):
        if player_name == self._player_username:
            self._won = True
        else:
            self._won = False
        self._finish_battle()

    def end_turn(self, turn: int):
        self.turn = turn

        # for mon in self.all_active_pokemons:
        #     if mon:
        #         mon.end_turn()
    
    # @property
    # @abstractmethod
    # def active_pokemon(self) -> Any:
    #     pass

    # @property
    # @abstractmethod
    # def all_active_pokemons(self) -> List[Optional[Pokemon]]:
    #     pass

    @property
    @abstractmethod
    def available_moves(self) -> Any:
        pass

    # @property
    # @abstractmethod
    # def available_switches(self) -> Any:
    #     pass

    @property
    def game_tag(self) -> str:
        """
        :return: The game identifier.
        :rtype: str
        """
        return self._game_tag


    # @property
    # def fields(self) -> Dict[Field, int]:
    #     """
    #     :return: A Dict mapping fields to the turn they have been activated.
    #     :rtype: Dict[Field, int]
    #     """
    #     return self._fields

    # @property
    # def finished(self) -> bool:
    #     """
    #     :return: A boolean indicating whether the battle is finished.
    #     :rtype: Optional[bool]
    #     """
    #     return self._finished
    

    # @property
    # @abstractmethod
    # def force_switch(self) -> Any:
    #     pass

    # @property
    # def lost(self) -> Optional[bool]:
    #     """
    #     :return: If the battle is finished, a boolean indicating whether the battle is
    #         lost. Otherwise None.
    #     :rtype: Optional[bool]
    #     """
    #     return None if self._won is None else not self._won
    

    # @property
    # @abstractmethod
    # def maybe_trapped(self) -> Any:
    #     pass

    # # @property
    # # def observations(self) -> Dict[int, Observation]:
    # #     """
    # #     :return: Observations of the battle on a turn, where the key is the turn number.
    # #         The Observation stores the battle state at the beginning of the turn,
    # #         and all the events that transpired on that turn.
    # #     :rtype: Dict[int, Observation]
    # #     """
    # #     return self._observations


    # @property
    # def player_role(self) -> Optional[str]:
    #     """
    #     :return: Player's role in given battle. p1/p2
    #     :rtype: str, optional
    #     """
    #     return self._player_role
    

    # @property
    # def rating(self) -> Optional[int]:
    #     """
    #     Player's rating after the end of the battle, if it was received.

    #     :return: The player's rating after the end of the battle.
    #     :rtype: int, optional
    #     """
    #     return self._rating
    
    # @property
    # def rqid(self) -> int:
    #     """
    #     Should not be used.

    #     :return: The last request's rqid.
    #     :rtype: Tuple[str, str]
    #     """
    #     return self._rqid

    # @property
    # @abstractmethod
    # def trapped(self) -> Any:
    #     pass

    # @trapped.setter
    # @abstractmethod
    # def trapped(self, value: Any):
    #     pass

    # @property
    # def turn(self) -> int:
    #     """
    #     :return: The current battle turn.
    #     :rtype: int
    #     """
    #     return self._turn

    # @turn.setter
    # def turn(self, turn: int):
    #     """Sets the current turn counter to given value.

    #     :param turn: Current turn value.
    #     :type turn: int
    #     """
    #     self._turn = turn
    
    # @property
    # def won(self) -> Optional[bool]:
    #     """
    #     :return: If the battle is finished, a boolean indicating whether the battle is
    #         won. Otherwise None.
    #     :rtype: Optional[bool]
    #     """
    #     return self._won

    # @property
    # def reviving(self) -> bool:
    #     return self._reviving
