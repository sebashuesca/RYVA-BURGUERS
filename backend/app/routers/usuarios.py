"""Registro de clientes y CRUD administrativo de usuarios."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Rol, Usuario
from app.schemas.users import UsuarioCreate, UsuarioOut, UsuarioUpdate
from app.security import require_admin_key
from app.services.errors import BusinessError
from app.services.passwords import hash_password

router = APIRouter(prefix="/api/v1/usuarios", tags=["usuarios"])


def to_out(user: Usuario) -> UsuarioOut:
    return UsuarioOut(
        id_usuario=user.id_usuario,
        nombre=user.nombre,
        email=user.email,
        telefono=user.telefono,
        rol=user.rol.nombre_rol,
    )


@router.post("", response_model=UsuarioOut, status_code=201)
def register(body: UsuarioCreate, db: Session = Depends(get_db)):
    try:
        with db.begin():
            role = db.scalar(select(Rol).where(Rol.nombre_rol == "CLIENTE"))
            if role is None:
                raise BusinessError("Falta el rol CLIENTE en la base de datos", 503)
            user = Usuario(
                id_rol=role.id_rol,
                nombre=body.nombre.strip(),
                email=str(body.email).lower(),
                password_hash=hash_password(body.password),
                telefono=body.telefono,
            )
            db.add(user)
            db.flush()
            result = to_out(user)
        return result
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Correo ya registrado") from exc


@router.get("", response_model=list[UsuarioOut], dependencies=[Depends(require_admin_key)])
def list_users(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    users = db.scalars(select(Usuario).order_by(Usuario.id_usuario).limit(limit).offset(offset)).all()
    return [to_out(user) for user in users]


@router.get("/{id_usuario}", response_model=UsuarioOut, dependencies=[Depends(require_admin_key)])
def get_user(id_usuario: int, db: Session = Depends(get_db)):
    user = db.get(Usuario, id_usuario)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario inexistente")
    return to_out(user)


@router.put("/{id_usuario}", response_model=UsuarioOut, dependencies=[Depends(require_admin_key)])
def update_user(id_usuario: int, body: UsuarioUpdate, db: Session = Depends(get_db)):
    changes = body.model_dump(exclude_unset=True)
    for required in ("nombre", "email", "password"):
        if required in changes and changes[required] is None:
            raise BusinessError(f"{required} no puede ser nulo", 422)
    try:
        with db.begin():
            user = db.get(Usuario, id_usuario, with_for_update=True)
            if user is None:
                raise HTTPException(status_code=404, detail="Usuario inexistente")
            if "password" in changes:
                user.password_hash = hash_password(changes.pop("password"))
            if "email" in changes:
                changes["email"] = str(changes["email"]).lower()
            for key, value in changes.items():
                setattr(user, key, value)
            db.flush()
            result = to_out(user)
        return result
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Correo ya registrado") from exc


@router.delete("/{id_usuario}", status_code=204, dependencies=[Depends(require_admin_key)])
def delete_user(id_usuario: int, db: Session = Depends(get_db)):
    try:
        with db.begin():
            user = db.get(Usuario, id_usuario, with_for_update=True)
            if user is None:
                raise HTTPException(status_code=404, detail="Usuario inexistente")
            if user.rol.nombre_rol != "CLIENTE":
                raise BusinessError("Solo se pueden eliminar clientes desde esta ruta", 409)
            db.delete(user)
            db.flush()
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="El usuario tiene pedidos o seguimiento asociado") from exc
