from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Fornecedor(Base):
    """
    Fornecedor de produtos.
    Na importação inicial vem como 'Fornecedor 1'...'Fornecedor 6',
    podendo ser atualizado com nome e contato reais depois.
    """

    __tablename__ = "fornecedores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False, unique=True)
    segmento = Column(String(100), nullable=True)
    contato = Column(String(200), nullable=True)
    whatsapp = Column(String(20), nullable=True)
    lead_time_dias = Column(Integer, nullable=True)  # calculado automaticamente pelo Kanban
    ativo = Column(Integer, nullable=False, default=1)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    cotacoes = relationship("Cotacao", back_populates="fornecedor")
    pedidos = relationship("Pedido", back_populates="fornecedor")
