from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Especificacao(Base):
    """
    Representa cada linha da planilha de cotação.
    Ex: codigo=mmic01, marca=microsoft, descricao='Mouse Microsoft'
    """

    __tablename__ = "especificacoes"

    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)

    # Campos vindos da planilha
    codigo = Column(String(50), nullable=False, unique=True, index=True)
    marca = Column(String(100), nullable=True)
    descricao = Column(String(300), nullable=False)  # nome técnico p/ fornecedor
    unidade = Column(String(20), nullable=False, default="UN")

    # Referências de custo (atualizadas a cada importação)
    custo_planejado = Column(Numeric(12, 4), nullable=True)
    ultimo_custo = Column(Numeric(12, 4), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relacionamentos
    categoria = relationship("Categoria", back_populates="especificacoes")
    cotacoes = relationship("Cotacao", back_populates="especificacao")
    pedidos = relationship("Pedido", back_populates="especificacao")
