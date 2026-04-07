from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base


class Usuario(Base):
    """Usuário do sistema com autenticação JWT."""

    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(200), nullable=False, unique=True, index=True)
    senha_hash = Column(String(300), nullable=False)
    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
