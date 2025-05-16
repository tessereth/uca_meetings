#!/bin/bash

set -e

SCRIPT_DIR="$(dirname "$0")"
PROJECT_DIR="$(realpath "$SCRIPT_DIR/..")"
cd "$PROJECT_DIR"

# Build frontend assets

cd frontend
nvm install $(cat .nvmrc)
npm install
npm run build

cd ../backend
rm -rf static
cp -r ../frontend/build/client static

# Setup python environment

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
sudo -u uca_meetings .venv/bin/alembic upgrade head

sudo systemctl enable deploy/uca_meetings.service