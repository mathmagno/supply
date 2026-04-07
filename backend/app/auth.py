from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.usuario import Usuario

# ── Configuração de hash de senha ────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── OAuth2 — token extraído do header Authorization: Bearer <token> ──────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# ── Utilitários de senha ─────────────────────────────────────────────────────

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_plana, senha_hash)


def gerar_hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)


# ── Utilitários de token JWT ─────────────────────────────────────────────────

def criar_token_acesso(dados: dict, expira_em: Optional[timedelta] = None) -> str:
    payload = dados.copy()
    expiracao = datetime.now(timezone.utc) + (
        expira_em or timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    )
    payload.update({"exp": expiracao})
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decodificar_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependency: usuário autenticado ─────────────────────────────────────────
# AUTH_DISABLED: retorna usuário fictício sem validar token
AUTH_DISABLED = True


def get_usuario_atual(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    if AUTH_DISABLED:
        return Usuario(id=0, nome="Dev", email="dev@local", ativo=True)

    payload = decodificar_token(token)
    email: str = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")

    usuario = db.query(Usuario).filter(Usuario.email == email, Usuario.ativo == True).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado.")
    return usuario
