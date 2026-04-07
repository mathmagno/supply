from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_usuario_atual
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaOut

router = APIRouter()


@router.get("/", response_model=list[CategoriaOut])
def listar(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    return db.query(Categoria).order_by(Categoria.nome).all()


@router.post("/", response_model=CategoriaOut, status_code=201)
def criar(payload: CategoriaCreate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    if db.query(Categoria).filter(Categoria.nome == payload.nome).first():
        raise HTTPException(status_code=400, detail="Categoria já existe.")
    categoria = Categoria(**payload.model_dump())
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.get("/{id}", response_model=CategoriaOut)
def obter(id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    categoria = db.get(Categoria, id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    return categoria


@router.patch("/{id}", response_model=CategoriaOut)
def atualizar(id: int, payload: CategoriaUpdate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    categoria = db.get(Categoria, id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    for campo, valor in payload.model_dump(exclude_none=True).items():
        setattr(categoria, campo, valor)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.delete("/{id}", status_code=204)
def remover(id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    categoria = db.get(Categoria, id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    db.delete(categoria)
    db.commit()
