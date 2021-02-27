import json
import logging

from asgiref.sync import async_to_sync
from .models import Message, React
from channels.generic.websocket import JsonWebsocketConsumer

logger = logging.getLogger(__name__)


class ChatConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.room_group_name = "chat"

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )

        self.accept()

    def disconnect(self, _close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    def receive_json(self, content, **_kwargs):
        if content["type"] == "message":
            message = Message(message=content["message"], user=self.channel_name)
            message.save()

            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": {"id": message.id, "message": message.message},
                },
            )
        elif content["type"] == "react":
            react = React(message_id=content["message_id"])
            react.save()

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "react_message",
                    "message_id": content["message_id"],
                    "count": React.objects.filter(
                        message_id=content["message_id"]
                    ).count(),
                },
            )

    # Receive message from room group
    def chat_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        self.send_json(
            {
                "type": "message",
                "payload": {"message": message["message"], "id": message["id"]},
            }
        )

    def react_message(self, event):
        self.send_json(
            {
                "type": "react",
                "payload": {"message_id": event["message_id"], "count": event["count"]},
            }
        )
