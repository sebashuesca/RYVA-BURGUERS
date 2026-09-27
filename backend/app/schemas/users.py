from pydantic import BaseModel, EmailStr, Field


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    telefono: str | None = Field(default=None, max_length=25)


class UsuarioLogin(BaseModel):
    # El seeder académico usa example.test, un dominio reservado que EmailStr rechaza.
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    telefono: str | None = Field(default=None, max_length=25)


class UsuarioOut(BaseModel):
    id_usuario: int
    nombre: str
    # Los seeders académicos usan example.test; se muestran sin revalidar MX.
    email: str
    telefono: str | None
    rol: str
