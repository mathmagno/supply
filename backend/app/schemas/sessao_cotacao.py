from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class SessaoCotacaoCreate(BaseModel):
    data_cotacao: date
    descricao: str | None = None
    arquivo_origem: str | None = None


class SessaoCotacaoOut(SessaoCotacaoCreate):
    id: int
    criado_em: datetime
    # estatísticas calculadas
    total_produtos: int = 0
    total_fornecedores: int = 0
    tem_pedidos: bool = False
    status_kanban: str | None = None  # status mais avançado dos pedidos desta sessão

    model_config = ConfigDict(from_attributes=True)
