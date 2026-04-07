from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FornecedorBase(BaseModel):
    nome: str
    segmento: str | None = None
    contato: str | None = None
    whatsapp: str | None = None
    lead_time_dias: int | None = None
    ativo: int = 1


class FornecedorCreate(FornecedorBase):
    pass


class FornecedorUpdate(BaseModel):
    nome: str | None = None
    segmento: str | None = None
    contato: str | None = None
    whatsapp: str | None = None
    lead_time_dias: int | None = None
    ativo: int | None = None


class FornecedorOut(FornecedorBase):
    id: int
    criado_em: datetime
    lead_time_calculado: int | None = None  # média real do Kanban

    model_config = ConfigDict(from_attributes=True)
