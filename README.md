# UCA Meetings

An app for managing UCA meetings.

It's build with the following technology:

* Python FastAPI
* Postgres
* SQL Model
* [Alembic](https://alembic.sqlalchemy.org/en/latest/index.html)
* React
* [Material UI](https://mui.com/material-ui/getting-started/)
* Pubsub TBD

## Development

### Backend

To set up the backend virtual environment, follow the instructions [here](https://fastapi.tiangolo.com/virtual-environments).

Common virtual environment tasks:

```sh
source .venv/bin/activate
pip install -r backend/requirements.txt
```

To set up the database, ensure you have postgres running and then:

```
psql postgres -c "CREATE DATABASE uca_meetings"
cd backend
alembic upgrade head
```

Run the webserver:

```sh
fastapi dev backend/main.py
```

View swagger docs at http://127.0.0.1:8000/docs.

Useful database commands:

```
psql -d uca_meetings -c 'TABLE "user"; TABLE meeting; TABLE participation;'
psql -d uca_meetings -c 'DELETE FROM participation; DELETE FROM "user"; DELETE FROM meeting;'
```

Files are formatted/linted using [ruff](https://github.com/astral-sh/ruff):

```sh
ruff format backend
ruff check backend
```

### Frontend

Install a node version manager, eg https://github.com/tj/n.

```sh
cd frontend
npm install
npm run dev
```

The frontend dev server proxies requests to `/api*` to the python server to work around CORS.

In production, the python server serves the frontend assets. To simulate this in dev:

```sh
cd frontend
npm run build
cd ../backend
ln -s ../frontend/build/client static
```

The frontend is formatted using [prettier](https://prettier.io/):

```sh
cd frontend
npm run format
```