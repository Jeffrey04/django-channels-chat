from django.db import models


class Message(models.Model):
    user = models.TextField()
    message = models.TextField()
    ctime = models.DateTimeField(auto_now_add=True)


class React(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    ctime = models.DateTimeField(auto_now_add=True)
