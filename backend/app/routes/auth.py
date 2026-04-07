from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.auth import verificar_senha, gerar_hash_senha, criar_token_acesso, get_usuario_atual
from app.schemas.usuario import UsuarioCreate, UsuarioOut, TokenOut

router = APIRouter()


@router.post("/login", response_model=TokenOut)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Autentica usuário e retorna token JWT."""
    usuario = db.query(Usuario).filter(Usuario.email == form.username).first()
    if not usuario or not verificar_senha(form.password, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos.",
        )
    token = criar_token_acesso({"sub": usuario.email})
    return TokenOut(access_token=token, usuario=usuario)


@router.post("/registrar", response_model=UsuarioOut, status_code=201)
def registrar(payload: UsuarioCreate, db: Session = Depends(get_db)):
    """Cria novo usuário (disponível apenas na primeira configuração ou para admins)."""
    if db.query(Usuario).filter(Usuario.email == payload.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    usuario = Usuario(
        nome=payload.nome,
        email=payload.email,
        senha_hash=gerar_hash_senha(payload.senha),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.get("/me", response_model=UsuarioOut)
def perfil_atual(usuario: Usuario = Depends(get_usuario_atual)):
    """Retorna dados do usuário autenticado."""
    return usuario
