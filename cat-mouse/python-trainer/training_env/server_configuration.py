
from typing import NamedTuple


class ServerConfiguration(NamedTuple):
    """Server configuration object. Represented with a tuple with two entries: server url
    and authentication endpoint url."""

    websocket_url: str
    authentication_url: str


LocalhostServerConfiguration = ServerConfiguration(
    "ws://localhost:3000/",
    "https://localhost:3000/",
)
