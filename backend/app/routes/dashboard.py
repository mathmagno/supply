from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, and_, case
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_usuario_atual
from app.models.pedido import Pedido, StatusPedido
from app.models.cotacao import Cotacao
from app.models.especificacao import Especificacao
from app.models.fornecedor import Fornecedor

router = APIRouter()


@router.get("/saving")
def saving_geral(
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual),
):
    """
    Retorna saving total, por produto e por fornecedor
    para pedidos com status 'recebido'.
    """
    q = db.query(Pedido).filter(Pedido.status == StatusPedido.RECEBIDO)
    if data_inicio:
        q = q.filter(Pedido.data_recebimento >= data_inicio)
    if data_fim:
        q = q.filter(Pedido.data_recebimento <= data_fim)

    pedidos = q.all()

    saving_total = sum((p.saving or Decimal("0")) for p in pedidos)
    gasto_total = sum(
        (p.custo_comprado or Decimal("0")) * (p.quantidade or Decimal("1"))
        for p in pedidos
    )

    # Saving por fornecedor
    por_fornecedor: dict[str, Decimal] = {}
    for p in pedidos:
        nome = p.fornecedor.nome if p.fornecedor else "N/A"
        por_fornecedor[nome] = por_fornecedor.get(nome, Decimal("0")) + (p.saving or Decimal("0"))

    # Saving por especificação (produto)
    por_spec: dict[str, Decimal] = {}
    for p in pedidos:
        codigo = p.especificacao.codigo if p.especificacao else "N/A"
        por_spec[codigo] = por_spec.get(codigo, Decimal("0")) + (p.saving or Decimal("0"))

    return {
        "saving_total": float(saving_total),
        "gasto_total": float(gasto_total),
        "total_pedidos_recebidos": len(pedidos),
        "por_fornecedor": [
            {"fornecedor": k, "saving": float(v)} for k, v in sorted(por_fornecedor.items())
        ],
        "por_especificacao": [
            {"codigo": k, "saving": float(v)}
            for k, v in sorted(por_spec.items(), key=lambda x: -x[1])
        ],
    }


@router.get("/historico-precos/{especificacao_id}")
def historico_precos(
    especificacao_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual),
):
    """Histórico de preços por fornecedor para uma especificação."""
    from app.models.sessao_cotacao import SessaoCotacao

    registros = (
        db.query(
            Cotacao.preco,
            Cotacao.fornecedor_id,
            Fornecedor.nome.label("fornecedor_nome"),
            SessaoCotacao.data_cotacao,
        )
        .join(Fornecedor, Cotacao.fornecedor_id == Fornecedor.id)
        .join(SessaoCotacao, Cotacao.sessao_id == SessaoCotacao.id)
        .filter(Cotacao.especificacao_id == especificacao_id)
        .order_by(SessaoCotacao.data_cotacao)
        .all()
    )

    # Agrupa por fornecedor para gráfico de série temporal
    por_fornecedor: dict[str, list] = {}
    for r in registros:
        por_fornecedor.setdefault(r.fornecedor_nome, []).append(
            {"data": str(r.data_cotacao), "preco": float(r.preco)}
        )

    return {"especificacao_id": especificacao_id, "series": [
        {"fornecedor": k, "dados": v} for k, v in por_fornecedor.items()
    ]}


@router.get("/sla")
def sla_metrics(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    """Tempo médio de resposta (cotando→pedido_emitido) e entrega (pedido_emitido→recebido) por fornecedor."""

    # Tempo de resposta: dias entre criado_em e data_pedido
    resposta = (
        db.query(
            Pedido.fornecedor_id,
            Fornecedor.nome.label("fornecedor_nome"),
            func.avg(
                func.julianday(Pedido.data_pedido) - func.julianday(Pedido.criado_em)
            ).label("tempo_resposta_medio"),
            func.count(Pedido.id).label("total_com_emissao"),
        )
        .join(Fornecedor, Pedido.fornecedor_id == Fornecedor.id)
        .filter(Pedido.data_pedido.isnot(None))
        .group_by(Pedido.fornecedor_id)
        .all()
    )

    # Tempo de entrega: dias entre data_pedido e data_recebimento
    entrega = (
        db.query(
            Pedido.fornecedor_id,
            func.avg(
                func.julianday(Pedido.data_recebimento) - func.julianday(Pedido.data_pedido)
            ).label("tempo_entrega_medio"),
            func.count(Pedido.id).label("total_recebidos"),
        )
        .filter(
            Pedido.status == StatusPedido.RECEBIDO,
            Pedido.data_pedido.isnot(None),
            Pedido.data_recebimento.isnot(None),
        )
        .group_by(Pedido.fornecedor_id)
        .all()
    )

    entrega_map = {r.fornecedor_id: r for r in entrega}

    resultado = []
    for r in resposta:
        ent = entrega_map.get(r.fornecedor_id)
        resultado.append({
            "fornecedor": r.fornecedor_nome,
            "tempo_resposta_medio": round(float(r.tempo_resposta_medio), 1) if r.tempo_resposta_medio else None,
            "tempo_entrega_medio": round(float(ent.tempo_entrega_medio), 1) if ent and ent.tempo_entrega_medio else None,
            "total_com_emissao": r.total_com_emissao,
            "total_recebidos": ent.total_recebidos if ent else 0,
        })

    resultado.sort(key=lambda x: x["tempo_resposta_medio"] or 9999)
    return resultado


@router.get("/resumo")
def resumo(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    """Cards de resumo para o dashboard principal."""
    total_pedidos = db.query(func.count(Pedido.id)).scalar()
    em_aberto = db.query(func.count(Pedido.id)).filter(
        Pedido.status.notin_([StatusPedido.RECEBIDO])
    ).scalar()
    saving_acumulado = db.query(func.sum(Pedido.saving)).filter(
        Pedido.status == StatusPedido.RECEBIDO
    ).scalar() or 0

    return {
        "total_pedidos": total_pedidos,
        "pedidos_em_aberto": em_aberto,
        "saving_acumulado": float(saving_acumulado),
    }
