from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth import get_usuario_atual
from app.models.cotacao import Cotacao
from app.models.sessao_cotacao import SessaoCotacao
from app.models.especificacao import Especificacao
from app.schemas.cotacao import CotacaoCreate, CotacaoOut, CotacaoComparativaOut, PrecoFornecedorOut
from app.schemas.sessao_cotacao import SessaoCotacaoCreate, SessaoCotacaoOut

router = APIRouter()


# ── Sessões ───────────────────────────────────────────────────────────────────

@router.get("/sessoes", response_model=list[SessaoCotacaoOut])
def listar_sessoes(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    return db.query(SessaoCotacao).order_by(SessaoCotacao.data_cotacao.desc()).all()


@router.post("/sessoes", response_model=SessaoCotacaoOut, status_code=201)
def criar_sessao(payload: SessaoCotacaoCreate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    sessao = SessaoCotacao(**payload.model_dump())
    db.add(sessao)
    db.commit()
    db.refresh(sessao)
    return sessao


@router.delete("/sessoes/{id}", status_code=204)
def remover_sessao(id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    sessao = db.get(SessaoCotacao, id)
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")
    # Remove as cotações vinculadas antes de deletar a sessão
    db.query(Cotacao).filter(Cotacao.sessao_id == id).delete()
    db.delete(sessao)
    db.commit()


# ── Preços de cotação ─────────────────────────────────────────────────────────

@router.get("/", response_model=list[CotacaoOut])
def listar(
    sessao_id: int | None = Query(None),
    especificacao_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual),
):
    q = db.query(Cotacao).options(
        joinedload(Cotacao.fornecedor),
        joinedload(Cotacao.especificacao),
    )
    if sessao_id:
        q = q.filter(Cotacao.sessao_id == sessao_id)
    if especificacao_id:
        q = q.filter(Cotacao.especificacao_id == especificacao_id)
    return q.all()


@router.post("/", response_model=CotacaoOut, status_code=201)
def criar(payload: CotacaoCreate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    cotacao = Cotacao(**payload.model_dump())
    db.add(cotacao)
    db.commit()
    db.refresh(cotacao)
    return db.query(Cotacao).options(joinedload(Cotacao.fornecedor)).filter(Cotacao.id == cotacao.id).first()


@router.delete("/{id}", status_code=204)
def remover(id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    cotacao = db.get(Cotacao, id)
    if not cotacao:
        raise HTTPException(status_code=404, detail="Cotação não encontrada.")
    db.delete(cotacao)
    db.commit()


# ── Tela comparativa (view principal de cotação) ──────────────────────────────

@router.get("/comparativa", response_model=list[CotacaoComparativaOut])
def comparativa(
    sessao_id: int = Query(..., description="ID da sessão de cotação"),
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual),
):
    sessao = db.get(SessaoCotacao, sessao_id)
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    cotacoes = (
        db.query(Cotacao)
        .options(
            joinedload(Cotacao.fornecedor),
            joinedload(Cotacao.especificacao).joinedload(Especificacao.categoria),
        )
        .filter(Cotacao.sessao_id == sessao_id)
        .all()
    )

    por_spec: dict[int, list[Cotacao]] = {}
    for c in cotacoes:
        por_spec.setdefault(c.especificacao_id, []).append(c)

    resultado = []
    for spec_id, precos in por_spec.items():
        menor = min(c.preco for c in precos)
        itens = [
            PrecoFornecedorOut(
                fornecedor_id=c.fornecedor_id,
                fornecedor_nome=c.fornecedor.nome,
                preco=c.preco,
                posicao_planilha=c.posicao_planilha,
                menor_preco=(c.preco == menor),
            )
            for c in sorted(precos, key=lambda x: x.posicao_planilha or 99)
        ]
        resultado.append(
            CotacaoComparativaOut(
                especificacao=precos[0].especificacao,
                sessao_id=sessao_id,
                data_cotacao=str(sessao.data_cotacao),
                precos=itens,
            )
        )
    return resultado
