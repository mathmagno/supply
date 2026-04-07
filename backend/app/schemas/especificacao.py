from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from .categoria import CategoriaOut


class EspecificacaoBase(BaseModel):
    categoria_id: int
    codigo: str
    marca: str | None = None
    descricao: str
    unidade: str = "UN"
    custo_planejado: Decimal | None = None
    ultimo_custo: Decimal | None = None


class EspecificacaoCreate(EspecificacaoBase):
    pass


class EspecificacaoUpdate(BaseModel):
    categoria_id: int | None = None
    marca: str | None = None
    descricao: str | None = None
    unidade: str | None = None
    custo_planejado: Decimal | None = None
    ultimo_custo: Decimal | None = None


class EspecificacaoOut(EspecificacaoBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime
    categoria: CategoriaOut

    model_config = ConfigDict(from_attributes=True)
