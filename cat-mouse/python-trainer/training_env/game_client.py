"""This module defines a base class for communicating with showdown servers.
"""

import asyncio
import json
import logging
from asyncio import CancelledError, Event, Lock, create_task, sleep
from logging import Logger
from time import perf_counter
from typing import Any, List, Optional, Set

import requests
import websockets.client as ws
from websockets.exceptions import ConnectionClosedOK

from .concurrency import (
    GAME_LOOP,
    create_in_game_loop,
    handle_threaded_coroutines,
)
from poke_env.exceptions import ShowdownException
from .account_configuration import AccountConfiguration
from .server_configuration import ServerConfiguration


class GameClient:
    """
    Basic Game client.

    Responsible for communicating with game servers. Also implements some higher
    level methods for basic tasks, such as low-level message
    handling.
    """
    #_handle_challenge_request, _handle_game_message, _update_challenges, are external handles they pluggin

    def __init__(
        self,
        account_configuration: AccountConfiguration,
        *,
        #avatar: Optional[str] = None,
        log_level: Optional[int] = None,
        server_configuration: ServerConfiguration,
        start_listening: bool = True,
        ping_interval: Optional[float] = 20.0,
        ping_timeout: Optional[float] = 20.0,
    ):
        """
        :param account_configuration: Account configuration.
        :type account_configuration: AccountConfiguration
        :param avatar: Account avatar name. Optional.
        :type avatar: str, optional
        :param log_level: The client's logger level.
        :type log_level: int. Defaults to logging's default level.
        :param server_configuration: Server configuration.
        :type server_configuration: ServerConfiguration
        :param start_listening: Whether to start listening to the server. Defaults to
            True.
        :type start_listening: bool
        :param ping_interval: How long between keepalive pings (Important for backend
            websockets). If None, disables keepalive entirely.
        :type ping_interval: float, optional
        :param ping_timeout: How long to wait for a timeout of a specific ping
            (important for backend websockets.
            Increase only if timeouts occur during runtime).
            If None pings will never time out.
        :type ping_timeout: float, optional
        """
        self._active_tasks: Set[Any] = set()
        self._ping_interval = ping_interval
        self._ping_timeout = ping_timeout

        self._server_configuration = server_configuration
        self._account_configuration = account_configuration

        #self._avatar = avatar

        self._logged_in: Event = create_in_game_loop(Event)
        self._sending_lock = create_in_game_loop(Lock)

        self.websocket: ws.WebSocketClientProtocol
        self._logger: Logger = self._create_logger(log_level)

        if start_listening:
            print("listening started...")
            self._listening_coroutine = asyncio.run_coroutine_threadsafe(
                self.listen(), GAME_LOOP
            )

    async def accept_challenge(self, username: str, packed_team: Optional[str]):
        assert self.logged_in.is_set(), f"Expected {self.username} to be logged in."
        await self.set_team(packed_team)
        await self.send_message("/accept %s" % username)

    async def challenge(self, username: str, format_: str, packed_team: Optional[str]):
        print("challenging...")
        # manual set loggined
        #self.logged_in.set()
        assert self.logged_in.is_set(), f"Expected {self.username} to be logged in."
        #await self.set_team(packed_team)
        #await self.send_message(f"/challenge {username}, {format_}")
        await self.send_message(json.dumps({ "type": 'START_GAME' }))
        print(json.dumps({ "type": 'START_GAME' }))

    def _create_logger(self, log_level: Optional[int]) -> Logger:
        """Creates a logger for the client.

        Returns a Logger displaying asctime and the account's username before messages.

        :param log_level: The logger's level.
        :type log_level: int
        :return: The logger.
        :rtype: Logger
        """
        logger = logging.getLogger(self.username)

        stream_handler = logging.StreamHandler()
        if log_level is not None:
            logger.setLevel(log_level)

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        stream_handler.setFormatter(formatter)

        logger.addHandler(stream_handler)
        return logger

    async def _handle_message(self, message: str):
        """Handle received messages.

        :param message: The message to parse.
        :type message: str
        """
        # this gets added into listen()
        # which gets added to create_task(_handle_message)

        #basically passes to _handle_battle_message
        # else loggin via challstr
        # else update username
        # else handle challenge request
        #else log message

        self.logged_in.set() #manual set this on every message
        print("MESSAGE")
        print(json.loads(message))
        # handles game specific message
        message = json.loads(message) #[0] #GAMESPECIFIC: specific to game

        # manual correct "intent field"
        message = {
                    "intent": message["gameIntent"], 
                    "game_info": message
                    }

        if message['intent']=="move": 
            print(message)
            await self._handle_game_message(message) #should be a dict here
        elif message['intent']=="CHALLENGE": 
            await self._handle_challenge_request(message)

    async def _stop_listening(self):
        await self.websocket.close()

    async def change_avatar(self, avatar_name: Optional[str]):
        """Changes the account's avatar.

        :param avatar_name: The new avatar name. If None, nothing happens.
        :type avatar_name: int
        """
        await self.wait_for_login()
        if avatar_name is not None:
            await self.send_message(f"/avatar {avatar_name}")

    async def listen(self):
        """Listen to a game websocket and dispatch messages to be handled."""
        self.logger.info("Starting listening to game websocket")
        print("Starting listening to game websocket")
        try:
            async with ws.connect(
                self.websocket_url,
                max_queue=None,
                ping_interval=self._ping_interval,
                ping_timeout=self._ping_timeout,
            ) as websocket:
                self.websocket = websocket
                print("websocket attached.")
                async for message in websocket:
                    self.logger.info("\033[92m\033[1m<<<\033[0m %s", message)
                    task = create_task(self._handle_message(str(message))) # task to send message
                    self._active_tasks.add(task)
                    task.add_done_callback(self._active_tasks.discard)

        except ConnectionClosedOK:
            print("Websocket connection with %s closed", self.websocket_url)
            self.logger.warning(
                "Websocket connection with %s closed", self.websocket_url
            )
        except (CancelledError, RuntimeError) as e:
            print("Listen interrupted by %s", e)
            self.logger.critical("Listen interrupted by %s", e)
        except Exception as e:
            print(e)
            self.logger.exception(e)

    async def log_in(self, split_message: List[str]):
        """Log in with specified username and password.

        Split message contains information sent by the server. This information is
        necessary to log in.

        :param split_message: Message received from the server that triggers logging in.
        :type split_message: List[str]
        """
        if self.account_configuration.password:
            log_in_request = requests.post(
                self.server_configuration.authentication_url,
                data={
                    "act": "login",
                    "name": self.account_configuration.username,
                    "pass": self.account_configuration.password,
                    "challstr": split_message[2] + "%7C" + split_message[3],
                },
            )
            self.logger.info("Sending authentication request")
            assertion = json.loads(log_in_request.text[1:])["assertion"]
        else:
            self.logger.info("Bypassing authentication request")
            assertion = ""

        await self.send_message(f"/trn {self.username},0,{assertion}")

        await self.change_avatar(self._avatar)

    async def send_message(
        self, message: str, room: str = "", message_2: Optional[str] = None
    ):
        """Sends a message to the specified room.

        `message_2` can be used to send a sequence of length 2.

        :param message: The message to send.
        :type message: str
        :param room: The room to which the message should be sent.
        :type room: str
        :param message_2: Second element of the sequence to be sent. Optional.
        :type message_2: str, optional
        """
        if message_2:
            to_send = "|".join([room, message, message_2])
        else:
            #to_send = "|".join([room, message])
            to_send = message
        self.logger.info("\033[93m\033[1m>>>\033[0m %s", to_send)
        print("sending message...", to_send)
        await self.websocket.send(to_send)

    async def stop_listening(self):
        await handle_threaded_coroutines(self._stop_listening())

    async def wait_for_login(self, checking_interval: float = 0.001, wait_for: int = 5):
        start = perf_counter()
        while perf_counter() - start < wait_for:
            await sleep(checking_interval)
            if self.logged_in:
                return
        assert self.logged_in, f"Expected {self.username} to be logged in."

    @property
    def account_configuration(self) -> AccountConfiguration:
        """The client's account configuration.

        :return: The client's account configuration.
        :rtype: AccountConfiguration
        """
        return self._account_configuration

    @property
    def logged_in(self) -> Event:
        """Event object associated with user login.

        :return: The logged-in event
        :rtype: Event
        """
        return self._logged_in

    @property
    def logger(self) -> Logger:
        """Logger associated with the client.

        :return: The logger.
        :rtype: Logger
        """
        return self._logger

    @property
    def server_configuration(self) -> ServerConfiguration:
        """The client's server configuration.

        :return: The client's server configuration.
        :rtype: ServerConfiguration
        """
        return self._server_configuration

    @property
    def username(self) -> str:
        """The account's username.

        :return: The account's username.
        :rtype: str
        """
        return self.account_configuration.username

    @property
    def websocket_url(self) -> str:
        """The websocket url.

        It is derived from the server url.

        :return: The websocket url.
        :rtype: str
        """
        return self.server_configuration.websocket_url
