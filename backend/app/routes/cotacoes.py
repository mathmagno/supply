from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, and_, or_, case
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth import get_usuario_atual
from app.models.cotacao import Cotacao
from app.models.pedido import Pedido, StatusPedido
from app.models.sessao_cotacao import SessaoCotacao
from app.models.especificacao import Especificacao
from app.schemas.cotacao import CotacaoCreate, CotacaoOut, CotacaoComparativaOut, PrecoFornecedorOut
from app.schemas.sessao_cotacao import SessaoCotacaoCreate, SessaoCotacaoOut

router = APIRouter()


# ── Sessões ───────────────────────────────────────────────────────────────────

@router.get("/sessoes", response_model=list[SessaoCotacaoOut])
def listar_sessoes(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    sessoes = db.query(SessaoCotacao).order_by(SessaoCotacao.data_cotacao.desc()).all()

    # Estatísticas por sessão em uma única query
    stats = db.query(
        Cotacao.sessao_id,
        func.count(func.distinct(Cotacao.especificacao_id)).label("total_produtos"),
        func.count(func.distinct(Cotacao.fornecedor_id)).label("total_fornecedores"),
    ).group_by(Cotacao.sessao_id).all()

    stats_map = {s.sessao_id: s for s in stats}

    # Ordem de prioridade dos status (do mais avançado ao menos avançado)
    ORDEM_STATUS = ["recebido", "em_transito", "pedido_emitido", "aprovado", "cotando"]

    # Busca pedidos via (especificacao_id, fornecedor_id) de cada sessão
    # — não depende de cotacao_id estar preenchido no pedido
    status_por_sessao: dict[int, str] = {}
    for s in sessoes:
        pares = (
            db.query(Cotacao.especificacao_id, Cotacao.fornecedor_id)
            .filter(Cotacao.sessao_id == s.id)
            .distinct()
            .all()
        )
        if not pares:
            continue

        condicoes = or_(*[
            and_(
                Pedido.especificacao_id == spec_id,
                Pedido.fornecedor_id == forn_id,
            )
            for spec_id, forn_id in pares
        ])
        pedidos = db.query(Pedido.status).filter(condicoes).all()
        if pedidos:
            status_list = [p.status for p in pedidos]
            statuses = set(status_list)
            # Entrega parcial: ao menos um recebido mas não todos
            if StatusPedido.RECEBIDO in statuses and not all(
                s == StatusPedido.RECEBIDO for s in status_list
            ):
                status_por_sessao[s.id] = "parcial"
            else:
                for st in ORDEM_STATUS:
                    if st in statuses:
                        status_por_sessao[s.id] = st
                        break

    resultado = []
    for s in sessoes:
        out = SessaoCotacaoOut.model_validate(s)
        st = stats_map.get(s.id)
        out.total_produtos = st.total_produtos if st else 0
        out.total_fornecedores = st.total_fornecedores if st else 0
        out.status_kanban = status_por_sessao.get(s.id)
        out.tem_pedidos = s.id in status_por_sessao
        resultado.append(out)
    return resultado


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

    # ── Métricas em batch para todos os fornecedores da sessão ──────────────
    fornecedor_ids = list({c.fornecedor_id for c in cotacoes})

    metricas_rows = (
        db.query(
            Pedido.fornecedor_id,
            func.count(Pedido.id).label("total"),
            func.avg(
                func.julianday(Pedido.data_recebimento) - func.julianday(Pedido.data_pedido)
            ).label("lead_time_medio"),
            func.sum(
                case((
                    and_(
                        Pedido.prazo_fornecedor.isnot(None),
                        Pedido.data_recebimento <= Pedido.prazo_fornecedor,
                    ), 1), else_=0
                )
            ).label("no_prazo"),
            func.sum(
                case((Pedido.prazo_fornecedor.isnot(None), 1), else_=0)
            ).label("com_prazo"),
        )
        .filter(
            Pedido.fornecedor_id.in_(fornecedor_ids),
            Pedido.status == StatusPedido.RECEBIDO,
            Pedido.data_pedido.isnot(None),
            Pedido.data_recebimento.isnot(None),
        )
        .group_by(Pedido.fornecedor_id)
        .all()
    )

    metricas: dict[int, dict] = {}
    for row in metricas_rows:
        pontualidade = (row.no_prazo / row.com_prazo) if row.com_prazo else None
        metricas[row.fornecedor_id] = {
            "lead_time_medio": round(float(row.lead_time_medio), 1) if row.lead_time_medio else None,
            "taxa_pontualidade": round(float(pontualidade), 3) if pontualidade is not None else None,
            "total_pedidos_recebidos": row.total,
        }

    # ── Monta resultado ───────────────────────────────────────────────────────
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
                **metricas.get(c.fornecedor_id, {
                    "lead_time_medio": None,
                    "taxa_pontualidade": None,
                    "total_pedidos_recebidos": 0,
                }),
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
