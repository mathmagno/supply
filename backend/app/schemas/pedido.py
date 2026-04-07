from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, model_validator
from .especificacao import EspecificacaoOut
from .fornecedor import FornecedorOut


STATUS_VALIDOS = {"cotando", "aprovado", "pedido_emitido", "em_transito", "recebido"}


class PedidoCreate(BaseModel):
    especificacao_id: int
    fornecedor_id: int
    cotacao_id: int | None = None
    quantidade: Decimal = Decimal("1")
    preco_cotado: Decimal
    custo_planejado: Decimal | None = None
    prazo_fornecedor: date | None = None
    data_pedido: date | None = None
    observacoes: str | None = None


class PedidoUpdate(BaseModel):
    fornecedor_id: int | None = None
    status: str | None = None
    quantidade: Decimal | None = None
    preco_cotado: Decimal | None = None
    custo_planejado: Decimal | None = None
    custo_comprado: Decimal | None = None   # preenchido ao receber
    prazo_fornecedor: date | None = None
    data_pedido: date | None = None
    data_recebimento: date | None = None
    observacoes: str | None = None

    @model_validator(mode="after")
    def valida_status(self):
        if self.status and self.status not in STATUS_VALIDOS:
            raise ValueError(f"Status inválido. Use um de: {STATUS_VALIDOS}")
        return self


class PedidoOut(BaseModel):
    id: int
    especificacao: EspecificacaoOut
    fornecedor: FornecedorOut
    cotacao_id: int | None
    status: str
    quantidade: Decimal
    preco_cotado: Decimal
    custo_planejado: Decimal | None
    custo_comprado: Decimal | None
    saving: Decimal | None
    prazo_fornecedor: date | None
    data_pedido: date | None
    data_recebimento: date | None
    observacoes: str | None
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class PedidoKanbanOut(BaseModel):
    """Versão resumida para o board Kanban."""
    id: int
    especificacao_id: int
    especificacao_codigo: str
    especificacao_descricao: str
    fornecedor_nome: str
    status: str
    quantidade: Decimal
    preco_cotado: Decimal
    prazo_fornecedor: date | None
    prazo_vencido: bool        # calculado no serviço
    prazo_proximo: bool        # dentro de 3 dias

    model_config = ConfigDict(from_attributes=True)
