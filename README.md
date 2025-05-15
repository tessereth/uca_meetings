# UCA Meetings

An app for managing UCA meetings.

It's build with the following technology:

* Python FastAPI
* Postgres
* SQLAcadamy
* React
* [Chakra UI](https://chakra-ui.com/docs/components/concepts/overview)
* Pubsub TBD

## Development

### Backend

To set up the backend virtual environment, follow the instructions [here](https://fastapi.tiangolo.com/virtual-environments).

Common virtual environment tasks:

```sh
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Run the webserver:

```sh
fastapi dev backend/main.py
```

View swagger docs at http://127.0.0.1:8000/docs.

### Frontend

Install a node version manager, eg https://github.com/tj/n.

```sh
cd frontend
npm install
npm run dev
```