from sqlalchemy import Column, Integer, String, Date, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class SessaoCotacao(Base):
    """
    Agrupa todos os preços coletados em uma mesma data/upload.
    Cada importação de planilha cria uma sessão.
    """

    __tablename__ = "sessoes_cotacao"

    id = Column(Integer, primary_key=True, index=True)
    data_cotacao = Column(Date, nullable=False, index=True)
    descricao = Column(String(200), nullable=True)   # ex: "Importação planilha março/2026"
    arquivo_origem = Column(String(300), nullable=True)  # nome do .xlsx no storage
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    cotacoes = relationship(
        "Cotacao", back_populates="sessao", cascade="all, delete-orphan"
    )
