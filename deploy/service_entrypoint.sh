#!/bin/bash

set -e

echo "Starting service" >> /var/log/uca_meetings/init.log

cd backend

echo "Activating python" >> /var/log/uca_meetings/init.log

source ./.venv/bin/activate

echo "Starting FastAPI server" >> /var/log/uca_meetings/init.log

fastapi run main.py --port 80 > /var/log/uca_meetings/stdout.log 2> /var/log/uca_meetings/stderr.log
