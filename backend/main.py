from fastapi import (
    FastAPI,
    HTTPException,
)
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from routers import meetings, users

app = FastAPI()

app.include_router(users.router)
app.include_router(meetings.router)


# Fallback to static files
app.mount("/static", StaticFiles(directory="static"), name="static")


# And then really fall back to index.html
@app.get("{full_path:path}")
def default_index(full_path: str):
    if full_path.startswith("/api/"):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse("static/index.html")
