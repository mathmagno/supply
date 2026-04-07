from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class SessaoCotacaoCreate(BaseModel):
    data_cotacao: date
    descricao: str | None = None
    arquivo_origem: str | None = None


class SessaoCotacaoOut(SessaoCotacaoCreate):
    id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
