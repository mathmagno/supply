from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth import get_usuario_atual
from app.models.pedido import Pedido, StatusPedido
from app.models.especificacao import Especificacao
from app.schemas.pedido import PedidoCreate, PedidoUpdate, PedidoOut, PedidoKanbanOut

router = APIRouter()

COLUNAS_KANBAN = [
    StatusPedido.COTANDO,
    StatusPedido.PEDIDO_EMITIDO,
    StatusPedido.RECEBIDO,
]

# Remapeia status legados para as 3 colunas
_STATUS_COLUNA = {
    StatusPedido.APROVADO: StatusPedido.COTANDO,
    StatusPedido.EM_TRANSITO: StatusPedido.PEDIDO_EMITIDO,
}

_JOINS = [
    joinedload(Pedido.especificacao).joinedload(Especificacao.categoria),
    joinedload(Pedido.fornecedor),
]


def _to_kanban(p: Pedido) -> PedidoKanbanOut:
    hoje = date.today()
    vencido = bool(p.prazo_fornecedor and p.prazo_fornecedor < hoje and p.status != StatusPedido.RECEBIDO)
    proximo = bool(
        p.prazo_fornecedor
        and hoje <= p.prazo_fornecedor <= hoje + timedelta(days=3)
        and p.status != StatusPedido.RECEBIDO
    )
    return PedidoKanbanOut(
        id=p.id,
        especificacao_id=p.especificacao_id,
        especificacao_codigo=p.especificacao.codigo,
        especificacao_descricao=p.especificacao.descricao,
        fornecedor_nome=p.fornecedor.nome,
        status=p.status,
        quantidade=p.quantidade,
        preco_cotado=p.preco_cotado,
        prazo_fornecedor=p.prazo_fornecedor,
        prazo_vencido=vencido,
        prazo_proximo=proximo,
        criado_em=p.criado_em,
        data_pedido=p.data_pedido,
        data_recebimento=p.data_recebimento,
    )


@router.get("/kanban", response_model=dict[str, list[PedidoKanbanOut]])
def kanban(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    pedidos = db.query(Pedido).options(*_JOINS).all()
    board: dict[str, list] = {col: [] for col in COLUNAS_KANBAN}
    for p in pedidos:
        coluna = _STATUS_COLUNA.get(p.status, p.status)
        if coluna in board:
            board[coluna].append(_to_kanban(p))
    return board


@router.get("/", response_model=list[PedidoOut])
def listar(
    status: str | None = Query(None),
    especificacao_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual),
):
    q = db.query(Pedido).options(*_JOINS)
    if status:
        q = q.filter(Pedido.status == status)
    if especificacao_id:
        q = q.filter(Pedido.especificacao_id == especificacao_id)
    return q.order_by(Pedido.criado_em.desc()).all()


@router.post("/", response_model=PedidoOut, status_code=201)
def criar(payload: PedidoCreate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    pedido = Pedido(**payload.model_dump())
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    return db.query(Pedido).options(*_JOINS).filter(Pedido.id == pedido.id).first()


@router.get("/{id}", response_model=PedidoOut)
def obter(id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    p = db.query(Pedido).options(*_JOINS).filter(Pedido.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    return p


@router.patch("/{id}", response_model=PedidoOut)
def atualizar(id: int, payload: PedidoUpdate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    p = db.get(Pedido, id)
    if not p:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")

    dados = payload.model_dump(exclude_none=True)

    if dados.get("status") == StatusPedido.PEDIDO_EMITIDO:
        if not dados.get("data_pedido") and not p.data_pedido:
            dados["data_pedido"] = date.today()

    if dados.get("status") == StatusPedido.RECEBIDO:
        custo_comprado = dados.get("custo_comprado", p.custo_comprado)
        if custo_comprado and p.custo_planejado:
            dados["saving"] = Decimal(str(p.custo_planejado)) - Decimal(str(custo_comprado))
        if not dados.get("data_recebimento"):
            dados["data_recebimento"] = date.today()
        # Atualiza o último custo da especificação com o preço pago
        if custo_comprado and p.especificacao_id:
            from app.models.especificacao import Especificacao
            spec = db.get(Especificacao, p.especificacao_id)
            if spec:
                spec.ultimo_custo = Decimal(str(custo_comprado))

    for campo, valor in dados.items():
        setattr(p, campo, valor)

    db.commit()
    return db.query(Pedido).options(*_JOINS).filter(Pedido.id == id).first()


@router.delete("/{id}", status_code=204)
def remover(id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    p = db.get(Pedido, id)
    if not p:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    db.delete(p)
    db.commit()
