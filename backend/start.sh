#!/bin/bash
# Wait for database to be ready, then run migrations
sleep 5
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port $PORT
