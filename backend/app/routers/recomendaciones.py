"""Complementos sugeridos para el carrito."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.orders import RecomendacionOut, UpsellIn
from app.services.upsell_engine import recommend

router = APIRouter(prefix="/api/v1/recomendaciones", tags=["recomendaciones"])


@router.post("", response_model=list[RecomendacionOut])
def recommendations(body: UpsellIn, db: Session = Depends(get_db)):
    return recommend(db, body.ids_productos)
