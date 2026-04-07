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
    menor_preco: bool = False  # flag calculada no serviço


class CotacaoComparativaOut(BaseModel):
    """
    View comparativa de todos os fornecedores para uma especificação
    em uma sessão. Usada na tela de cotação lado a lado.
    """
    especificacao: EspecificacaoOut
    sessao_id: int
    data_cotacao: str
    precos: list[PrecoFornecedorOut]

    model_config = ConfigDict(from_attributes=True)
