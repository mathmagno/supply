from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, and_
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
