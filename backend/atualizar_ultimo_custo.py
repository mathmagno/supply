"""
Atualiza ultimo_custo de todas as especificações com base no pedido
recebido mais recente de cada uma.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.pedido import Pedido, StatusPedido
from app.models.especificacao import Especificacao
from sqlalchemy import func

db = SessionLocal()

# Pega o custo_comprado mais recente por especificação (pedidos recebidos)
subq = (
    db.query(
        Pedido.especificacao_id,
        Pedido.custo_comprado,
        func.row_number().over(
            partition_by=Pedido.especificacao_id,
            order_by=Pedido.data_recebimento.desc(),
        ).label("rn"),
    )
    .filter(
        Pedido.status == StatusPedido.RECEBIDO,
        Pedido.custo_comprado.isnot(None),
    )
    .subquery()
)

rows = db.query(subq).filter(subq.c.rn == 1).all()

atualizados = 0
for row in rows:
    spec = db.get(Especificacao, row.especificacao_id)
    if spec and spec.ultimo_custo != row.custo_comprado:
        print(f"  {spec.codigo}: {spec.ultimo_custo} → {row.custo_comprado}")
        spec.ultimo_custo = row.custo_comprado
        atualizados += 1

db.commit()
db.close()
print(f"\n{atualizados} especificação(ões) atualizada(s).")
