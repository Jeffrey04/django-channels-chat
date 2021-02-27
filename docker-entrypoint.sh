#/usr/bin/bash

poetry run ./manage.py migrate

poetry run ./manage.py runserver