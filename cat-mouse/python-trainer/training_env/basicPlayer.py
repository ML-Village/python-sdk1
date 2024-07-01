import asyncio
import random
from abc import ABC, abstractmethod
from asyncio import Condition, Event, Queue, Semaphore
from logging import Logger
from time import perf_counter
from typing import Any, Awaitable, Dict, List, Optional, Union

import orjson

from .concurrency import create_in_game_loop, handle_threaded_coroutines
from .game import Game
from .game_client import GameClient
from .game_order import GameOrder, DefaultGameOrder
from .account_configuration import (
    CONFIGURATION_FROM_PLAYER_COUNTER,
    AccountConfiguration,
)
from .server_configuration import (
    LocalhostServerConfiguration,
    ServerConfiguration,
)
from .abstract_game import AbstractGame


class BasicPlayer(ABC):
    MESSAGES_TO_IGNORE = {"", "t:", "expire", "uhtmlchange"}

    # When an error resulting from an invalid choice is made, the next order has this
    # chance of being game's default order to prevent infinite loops
    DEFAULT_CHOICE_CHANCE = 1 / 1000

    def __init__(self,
        account_configuration: Optional[AccountConfiguration] = None,
        *,
        log_level: Optional[int] = None,
        max_concurrent_games: int = 1,
        server_configuration: Optional[ServerConfiguration] = None,
        start_timer_on_game_start: bool = False,
        start_listening: bool = True,
        ping_interval: Optional[float] = 20.0,
        ping_timeout: Optional[float] = 20.0,):
        
        if account_configuration is None:
            account_configuration = self._create_account_configuration()

        if server_configuration is None:
            server_configuration = LocalhostServerConfiguration
        
        self.game_client = GameClient(
            account_configuration=account_configuration,
            #avatar=avatar,
            log_level=log_level,
            server_configuration=server_configuration,
            start_listening=start_listening,
            ping_interval=ping_interval,
            ping_timeout=ping_timeout,
        )
        
        self.game_client._handle_game_message = self._handle_game_message  # type: ignore
        self.game_client._update_challenges = self._update_challenges  # type: ignore
        self.game_client._handle_challenge_request = self._handle_challenge_request  # type: ignore

        self._format: str = "placeholder" #battle_format
        self._max_concurrent_game: int = max_concurrent_games
        #self._save_replays = save_replays
        self._start_timer_on_game_start: bool = start_timer_on_game_start
        #self._accept_open_team_sheet: bool = accept_open_team_sheet

        self._games: Dict[str, AbstractGame] = {}
        self._game_semaphore: Semaphore = create_in_game_loop(Semaphore, 0)

        self._game_start_condition: Condition = create_in_game_loop(Condition)
        self._game_count_queue: Queue[Any] = create_in_game_loop(
            Queue, max_concurrent_games
        )
        self._game_end_condition: Condition = create_in_game_loop(Condition)
        self._challenge_queue: Queue[Any] = create_in_game_loop(Queue)

        # if isinstance(team, Teambuilder):
        #     self._team = team
        # elif isinstance(team, str):
        #     self._team = ConstantTeambuilder(team)
        # else:
        #     self._team = None

        self.logger.debug("Player initialisation finished")


    def _create_account_configuration(self)-> AccountConfiguration:
        key = type(self).__name__
        CONFIGURATION_FROM_PLAYER_COUNTER.update([key])
        username = "%s %d" % (key, CONFIGURATION_FROM_PLAYER_COUNTER[key])
        if len(username) > 18:
            username = "%s %d" % (
                key[: 18 - len(username)],
                CONFIGURATION_FROM_PLAYER_COUNTER[key],
            )
        return AccountConfiguration(username, None)

    def _battle_finished_callback(self, battle: AbstractGame):
        pass

    # def update_team(self, team: Union[Teambuilder, str]):
    #     """Updates the team used by the player.

    #     :param team: The new team to use.
    #     :type team: str or Teambuilder
    #     """
    #     if isinstance(team, Teambuilder):
    #         self._team = team
    #     else:
    #         self._team = ConstantTeambuilder(team)

    async def _create_game(self, split_message: List[str]) -> AbstractGame:
        """Returns game object corresponding to received message.

        :param split_message: The game initialisation message.
        :type split_message: List[str]
        :return: The corresponding battle object.
        :rtype: AbstractGame
        """
        print("create game")
        print("create game game info", split_message)
        # Battle initialisation
        game_tag = split_message.get("gameTag")
        #game_tag = "-".join(split_message)[1:]
        
        #previous they check if the format is correct
        #if not correct, raise Exception
        game = Game(
            game_tag=game_tag,
            username=self.username,
            logger=self.logger,
            #gen=self.gen,
            #save_replays=self._save_replays,
        )
        # clear game queue
        await self._game_count_queue.put(None)

        # if there is already a game in the queue, return it
        if game_tag in self._games:
            await self._game_count_queue.get()
            return self._games[game_tag]
        
        # else add game to games queue
        async with self._game_start_condition:
            self._game_semaphore.release()
            self._game_start_condition.notify_all()
            self._games[game_tag] = game
            print("game %s put into self._games" % (game_tag))
        
        # if self._start_timer_on_battle_start:
        #     await self.game_client.send_message("/timer on", game.game_tag)
        
        return game

    async def _get_game(self, game_tag: str) -> AbstractGame:
        #game_tag = game_tag[1:]
        print("getting game...", game_tag)
        print(self._games)
        while True:
            if game_tag in self._games:
                return self._games[game_tag]
            async with self._game_start_condition:
                await self._game_start_condition.wait()

    # messages come in the form of a dictionary
    # from whichever triggers handle_game_message

    async def _handle_game_message(self, gameDict: Dict[str, Any]):
        """Handles a game message.

        :param split_message: The received battle message.
        :type split_message: str
        """
        print("handling game message")
        # previous methods split messages from multiple lines
        # then check if the message is init
        # if it is, create a game object
        print(self._games)
        game_info = gameDict["game_info"]
        if (
            #(gameDict["intent"] == "init") and
            (gameDict["game_info"].get("gameTag") not in self._games)
        ):
            print("creating game..")
            print("game info: ", game_info)
            game = await self._create_game(game_info)
        else:
            print("getting game... becos of previous")
            print("game: ", gameDict["game_info"].get("gameTag"))
            game = await self._get_game(gameDict["game_info"].get("gameTag"))
            print(game)
        
        if(gameDict["intent"] == "win" or gameDict["intent"] == "tie"):
            await self._game_count_queue.get()
            self._game_count_queue.task_done()
            self._game_finished_callback(game)
            async with self._game_end_condition:
                self._game_end_condition.notify_all()
        elif gameDict["intent"] == "error":
            self.logger.log(25, "Error message received: %s", gameDict["error_message"])
            if game.trapped:
                await self._handle_game_request(game)
            #todo: add trapped situation in future
        elif gameDict["intent"] == "move":
            print("game intent is MOVE!!!")
            # print(gameDict)
            # print(game)
            # print(game_info)
            game.parse_message(game_info)
            print("currentPlayer: ", game_info.get("currentPlayer"))
            if game_info.get("currentPlayer") == "blue": 
                print("current player turn is blue, handling game request...")
                await self._handle_game_request(game)
        else:
            # do nothing here, just parse message and update state
            print("UNKNOWN GAME INTENT", gameDict)
            self.logger.warning("Unknown game intent: %s", gameDict)
            game.parse_message(game_info)
    

    async def _handle_game_request(
        self,
        game: AbstractGame,
        #from_teampreview_request: bool = False,
        #maybe_default_order: bool = False,
    ):
        print("handingling game request")
        message = self.choose_move(game)
        if isinstance(message, Awaitable):
            message = await message
        message = message.message

        await self.game_client.send_message(message, game.game_tag)
    
    async def _handle_challenge_request(self, split_message: List[str]):
        """Handles an individual challenge."""
        # basically queues a challenger

        #challenging_player = split_message[2].strip()

        # put a challenger into queue
        # if challenging_player != self.username:
        #     if len(split_message) >= 6:
        #         if split_message[5] == self._format:
        #             await self._challenge_queue.put(challenging_player)

    async def _update_challenges(self, split_message: List[str]):
        """Update internal challenge state.

        Add corresponding challenges to internal queue of challenges, where they will be
        processed if relevant.

        :param split_message: Recevied message, split.
        :type split_message: List[str]
        """

        # assuming the challenges in queue are to update while in queue

        # self.logger.debug("Updating challenges with %s", split_message)
        # challenges = orjson.loads(split_message[2]).get("challengesFrom", {})
        # for user, format_ in challenges.items():
        #     if format_ == self._format:
        #         await self._challenge_queue.put(user)

    async def accept_challenges(
        self,
        opponent: Optional[Union[str, List[str]]],
        n_challenges: int,
        packed_team: Optional[str] = None,
    ):
        """Let the player wait for challenges from opponent, and accept them.

        If opponent is None, every challenge will be accepted. If opponent if a string,
        all challenges from player with that name will be accepted. If opponent is a
        list all challenges originating from players whose name is in the list will be
        accepted.

        Up to n_challenges challenges will be accepted, after what the function will
        wait for these battles to finish, and then return.

        :param opponent: Players from which challenges will be accepted.
        :type opponent: None, str or list of str
        :param n_challenges: Number of challenges that will be accepted
        :type n_challenges: int
        :packed_team: Team to use. Defaults to generating a team with the agent's teambuilder.
        :type packed_team: string, optional.
        """
        # if packed_team is None:
        #     packed_team = self.next_team

        # await handle_threaded_coroutines(
        #     self._accept_challenges(opponent, n_challenges, packed_team)
        # )
        pass

    async def _accept_challenges(
        self,
        opponent: Optional[Union[str, List[str]]],
        n_challenges: int,
        packed_team: Optional[str],
    ):
        # if opponent:
        #     if isinstance(opponent, list):
        #         opponent = [to_id_str(o) for o in opponent]
        #     else:
        #         opponent = to_id_str(opponent)
        # await self.ps_client.logged_in.wait()
        # self.logger.debug("Event logged in received in accept_challenge")

        # for _ in range(n_challenges):
        #     while True:
        #         username = to_id_str(await self._challenge_queue.get())
        #         self.logger.debug(
        #             "Consumed %s from challenge queue in accept_challenge", username
        #         )
        #         if (
        #             (opponent is None)
        #             or (opponent == username)
        #             or (isinstance(opponent, list) and (username in opponent))
        #         ):
        #             await self.ps_client.accept_challenge(username, packed_team)
        #             await self._battle_semaphore.acquire()
        #             break
        # await self._battle_count_queue.join()
        pass


    @abstractmethod
    def choose_move(
        self, battle: AbstractGame
    ) -> Union[GameOrder, Awaitable[GameOrder]]:
        """Abstract method to choose a move in a battle.

        :param battle: The battle.
        :type battle: AbstractGame
        :return: The move order.
        :rtype: str
        """
        pass

    def choose_default_move(self) -> DefaultGameOrder:
        """Returns showdown's default move order.

        This order will result in the first legal order - according to showdown's
        ordering - being chosen.
        """
        return DefaultGameOrder()

    def choose_random_singles_move(self, game: Game) -> GameOrder:
        available_moves = [GameOrder(move) for move in game.available_moves]
        if available_moves:
            return available_moves[int(random.random() * len(available_moves))]
        else:
            print("choosing default move")
            return self.choose_default_move()
        
    def choose_random_move(self, game: AbstractGame) -> GameOrder:
        """Returns a random legal move from battle.

        :param battle: The battle in which to move.
        :type battle: AbstractGame
        :return: Move order
        :rtype: str
        """
        if isinstance(game, Game):
            print("choosing random singles move")
            return self.choose_random_singles_move(game)
        else:
            raise ValueError("Invalid game type. Received %d" % type(game))


    async def send_challenges(
        self, opponent: str, n_challenges: int, to_wait: Optional[Event] = None
    ):
        """Make the player send challenges to opponent.

        opponent must be a string, corresponding to the name of the player to challenge.

        n_challenges defines how many challenges will be sent.

        to_wait is an optional event that can be set, in which case it will be waited
        before launching challenges.

        :param opponent: Player username to challenge.
        :type opponent: str
        :param n_challenges: Number of battles that will be started
        :type n_challenges: int
        :param to_wait: Optional event to wait before launching challenges.
        :type to_wait: Event, optional.
        """
        await handle_threaded_coroutines(
            self._send_challenges(opponent, n_challenges, to_wait)
        )

    async def _send_challenges(
        self, opponent: str, n_challenges: int, to_wait: Optional[Event] = None
    ):
        print("sending challenge...")
        # make client loggin and wait
        await self.game_client.logged_in.wait() # wait for successful login (we mnanually login at every message)
        # self.logger.info("Event logged in received in send challenge")

        if to_wait is not None:
            await to_wait.wait()

        start_time = perf_counter()

        for _ in range(n_challenges):
            #await self.game_client.challenge(opponent, self._format, self.next_team)
            await self.game_client.challenge(opponent, self._format, "placeholder")
            await self._game_semaphore.acquire()
        await self._game_count_queue.join()
        print("Challenges (%d games) finished in %fs",
            n_challenges,
            perf_counter() - start_time,)
        self.logger.info(
            "Challenges (%d games) finished in %fs",
            n_challenges,
            perf_counter() - start_time,
        )
    
    def reset_games(self):
        """Resets the player's inner battle tracker."""
        for battle in list(self._games.values()):
            if not battle.finished:
                raise EnvironmentError(
                    "Can not reset player's battles while they are still running"
                )
        self._games = {}

    @property
    def games(self) -> Dict[str, AbstractGame]:
        return self._games
    
    @property
    def win_rate(self) -> float:
        return self.n_won_battles / self.n_finished_battles

    @property
    def logger(self) -> Logger:
        return self.game_client.logger

    @property
    def username(self) -> str:
        return self.game_client.username
