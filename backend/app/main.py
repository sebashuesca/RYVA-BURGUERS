"""Punto de entrada: uvicorn app.main:app --reload."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings
from app.database import engine
from app.routers import ingredientes, pedidos, productos, recomendaciones, usuarios
from app.services.errors import BusinessError

settings = get_settings()
app = FastAPI(title="RIVA BURGUERS API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://ryva-burguers.vercel.app"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)


@app.exception_handler(BusinessError)
async def business_error_handler(_request: Request, exc: BusinessError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/health")
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}


app.include_router(productos.router)
app.include_router(ingredientes.router)
app.include_router(pedidos.router)
app.include_router(recomendaciones.router)
app.include_router(usuarios.router)
