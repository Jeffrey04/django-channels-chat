FROM python:3.9

WORKDIR /app

COPY . /app

RUN mkdir data && \
    pip install poetry && \
    poetry install --no-dev && \
    chmod +x docker-entrypoint.sh \
    sync

ENTRYPOINT [ "docker-entrypoint.sh" ]
CMD ["run"]