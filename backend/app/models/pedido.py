from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class StatusPedido:
    COTANDO = "cotando"
    APROVADO = "aprovado"
    PEDIDO_EMITIDO = "pedido_emitido"
    EM_TRANSITO = "em_transito"
    RECEBIDO = "recebido"


class Pedido(Base):
    """
    Ordem de compra gerada a partir de uma cotação aprovada.
    Percorre o Kanban: Cotando → Aprovado → Pedido Emitido → Em Trânsito → Recebido.
    """

    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    especificacao_id = Column(
        Integer, ForeignKey("especificacoes.id"), nullable=False
    )
    fornecedor_id = Column(
        Integer, ForeignKey("fornecedores.id"), nullable=False
    )
    cotacao_id = Column(
        Integer, ForeignKey("cotacoes.id"), nullable=True  # cotação de origem (pode ser manual)
    )

    status = Column(String(30), nullable=False, default=StatusPedido.COTANDO, index=True)
    quantidade = Column(Numeric(12, 4), nullable=False, default=1)

    # Valores financeiros
    preco_cotado = Column(Numeric(12, 4), nullable=False)    # preço do fornecedor escolhido
    custo_planejado = Column(Numeric(12, 4), nullable=True)  # orçamento previsto (snapshot)
    custo_comprado = Column(Numeric(12, 4), nullable=True)   # valor real pago (preenchido ao receber)

    # Saving calculado automaticamente na recepção
    saving = Column(Numeric(12, 4), nullable=True)           # custo_planejado - custo_comprado

    # Datas e prazos
    prazo_fornecedor = Column(Date, nullable=True)   # data prometida pelo fornecedor
    data_pedido = Column(Date, nullable=True)
    data_recebimento = Column(Date, nullable=True)

    observacoes = Column(String(500), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relacionamentos
    especificacao = relationship("Especificacao", back_populates="pedidos")
    fornecedor = relationship("Fornecedor", back_populates="pedidos")
    cotacao_origem = relationship("Cotacao", foreign_keys=[cotacao_id])
