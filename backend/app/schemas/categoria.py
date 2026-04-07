from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CategoriaBase(BaseModel):
    nome: str


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(BaseModel):
    nome: str | None = None


class CategoriaOut(CategoriaBase):
    id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
