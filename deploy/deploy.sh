#!/bin/bash

set -e

SCRIPT_DIR="$(dirname "$0")"
PROJECT_DIR="$(realpath "$SCRIPT_DIR/..")"
cd "$PROJECT_DIR"

# Build frontend assets

# load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
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

cd ..
if ! systemctl list-unit-files | grep -q "uca_meetings.service"; then
  sudo systemctl enable deploy/uca_meetings.service
fi
sudo systemctl daemon-reload
sudo systemctl restart uca_meetings
sudo systemctl status uca_meetings
