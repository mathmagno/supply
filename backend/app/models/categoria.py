from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Categoria(Base):
    """Tipo genérico de produto. Ex: Mouse, Teclado, Monitor."""

    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    especificacoes = relationship(
        "Especificacao", back_populates="categoria", cascade="all, delete-orphan"
    )
