from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Cotacao(Base):
    """
    Preço cotado para uma especificação, por fornecedor, dentro de uma sessão.
    Representa o pivot das colunas 'fornecedor 1'...'fornecedor 6' da planilha.
    """

    __tablename__ = "cotacoes"

    id = Column(Integer, primary_key=True, index=True)
    sessao_id = Column(
        Integer, ForeignKey("sessoes_cotacao.id", ondelete="CASCADE"), nullable=False
    )
    especificacao_id = Column(
        Integer, ForeignKey("especificacoes.id", ondelete="CASCADE"), nullable=False
    )
    fornecedor_id = Column(
        Integer, ForeignKey("fornecedores.id", ondelete="CASCADE"), nullable=False
    )

    preco = Column(Numeric(12, 4), nullable=False)
    posicao_planilha = Column(Integer, nullable=True)  # 1..6 — coluna de origem no xlsx
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    sessao = relationship("SessaoCotacao", back_populates="cotacoes")
    especificacao = relationship("Especificacao", back_populates="cotacoes")
    fornecedor = relationship("Fornecedor", back_populates="cotacoes")
