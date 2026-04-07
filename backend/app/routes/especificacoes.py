from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth import get_usuario_atual
from app.models.especificacao import Especificacao
from app.schemas.especificacao import EspecificacaoCreate, EspecificacaoUpdate, EspecificacaoOut

router = APIRouter()


@router.get("/", response_model=list[EspecificacaoOut])
def listar(
    categoria_id: int | None = Query(None),
    busca: str | None = Query(None, description="Filtra por código, marca ou descrição"),
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual),
):
    q = db.query(Especificacao).options(joinedload(Especificacao.categoria))
    if categoria_id:
        q = q.filter(Especificacao.categoria_id == categoria_id)
    if busca:
        termo = f"%{busca}%"
        q = q.filter(
            Especificacao.codigo.ilike(termo)
            | Especificacao.descricao.ilike(termo)
            | Especificacao.marca.ilike(termo)
        )
    return q.order_by(Especificacao.codigo).all()


@router.post("/", response_model=EspecificacaoOut, status_code=201)
def criar(payload: EspecificacaoCreate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    if db.query(Especificacao).filter(Especificacao.codigo == payload.codigo).first():
        raise HTTPException(status_code=400, detail="Código já cadastrado.")
    spec = Especificacao(**payload.model_dump())
    db.add(spec)
    db.commit()
    db.refresh(spec)
    return db.query(Especificacao).options(joinedload(Especificacao.categoria)).filter(Especificacao.id == spec.id).first()


@router.get("/{id}", response_model=EspecificacaoOut)
def obter(id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    spec = db.query(Especificacao).options(joinedload(Especificacao.categoria)).filter(Especificacao.id == id).first()
    if not spec:
        raise HTTPException(status_code=404, detail="Especificação não encontrada.")
    return spec


@router.patch("/{id}", response_model=EspecificacaoOut)
def atualizar(id: int, payload: EspecificacaoUpdate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    spec = db.get(Especificacao, id)
    if not spec:
        raise HTTPException(status_code=404, detail="Especificação não encontrada.")
    for campo, valor in payload.model_dump(exclude_none=True).items():
        setattr(spec, campo, valor)
    db.commit()
    return db.query(Especificacao).options(joinedload(Especificacao.categoria)).filter(Especificacao.id == id).first()


@router.delete("/{id}", status_code=204)
def remover(id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    spec = db.get(Especificacao, id)
    if not spec:
        raise HTTPException(status_code=404, detail="Especificação não encontrada.")
    db.delete(spec)
    db.commit()
