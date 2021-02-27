from channels.routing import ProtocolTypeRouter, URLRouter

import chat.routing

application = ProtocolTypeRouter(
    {"websocket": URLRouter(chat.routing.websocket_urlpatterns)}
)
