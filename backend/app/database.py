"""Engine MySQL y una sesión independiente por petición."""

import ssl
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


def make_engine():
    settings = get_settings()
    url = make_url(settings.database_url)
    if url.drivername not in {"mysql", "mysql+pymysql"}:
        raise ValueError("DATABASE_URL debe usar mysql:// o mysql+pymysql://")
    url = url.set(drivername="mysql+pymysql")

    connect_args: dict = {"connect_timeout": 10, "read_timeout": 15, "write_timeout": 15}
    if settings.db_ssl_required or settings.app_env == "production":
        if not (settings.mysql_ssl_ca or settings.mysql_ssl_ca_pem):
            raise ValueError("MYSQL_SSL_CA o MYSQL_SSL_CA_PEM es obligatorio para SSL")
        # SSLContext exige certificado válido y nombre de host coincidente.
        context = ssl.create_default_context(
            cafile=settings.mysql_ssl_ca,
            cadata=settings.mysql_ssl_ca_pem,
        )
        context.check_hostname = True
        context.verify_mode = ssl.CERT_REQUIRED
        connect_args["ssl"] = context
    elif settings.app_env != "development":
        raise ValueError("Solo development puede desactivar DB_SSL_REQUIRED")

    return create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=5,
        max_overflow=5,
        connect_args=connect_args,
    )


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
