from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from .fornecedor import FornecedorOut
from .especificacao import EspecificacaoOut


class CotacaoCreate(BaseModel):
    sessao_id: int
    especificacao_id: int
    fornecedor_id: int
    preco: Decimal
    posicao_planilha: int | None = None


class CotacaoOut(CotacaoCreate):
    id: int
    criado_em: datetime
    fornecedor: FornecedorOut

    model_config = ConfigDict(from_attributes=True)


class PrecoFornecedorOut(BaseModel):
    """Preço de um fornecedor específico dentro de uma comparativa."""
    fornecedor_id: int
    fornecedor_nome: str
    preco: Decimal
    posicao_planilha: int | None = None
    menor_preco: bool = False
    # métricas de desempenho calculadas a partir do histórico de pedidos
    lead_time_medio: float | None = None
    taxa_pontualidade: float | None = None   # 0.0 a 1.0
    total_pedidos_recebidos: int = 0


class CotacaoComparativaOut(BaseModel):
    """
    View comparativa de todos os fornecedores para uma especificação
    em uma sessão. Usada na tela de cotação lado a lado.
    """
    especificacao: EspecificacaoOut
    sessao_id: int
    data_cotacao: str
    precos: list[PrecoFornecedorOut]
    status_pedido: str | None = None   # status do pedido gerado para esta spec

    model_config = ConfigDict(from_attributes=True)
