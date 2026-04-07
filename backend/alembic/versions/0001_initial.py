"""initial

Revision ID: 0001
Revises:
Create Date: 2026-04-07

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categorias",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("nome", sa.String(100), nullable=False, unique=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "fornecedores",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("nome", sa.String(150), nullable=False, unique=True),
        sa.Column("segmento", sa.String(100), nullable=True),
        sa.Column("contato", sa.String(200), nullable=True),
        sa.Column("whatsapp", sa.String(20), nullable=True),
        sa.Column("lead_time_dias", sa.Integer(), nullable=True),
        sa.Column("ativo", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "especificacoes",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("categoria_id", sa.Integer(), sa.ForeignKey("categorias.id"), nullable=False),
        sa.Column("codigo", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("marca", sa.String(100), nullable=True),
        sa.Column("descricao", sa.String(300), nullable=False),
        sa.Column("unidade", sa.String(20), nullable=False, server_default="UN"),
        sa.Column("custo_planejado", sa.Numeric(12, 4), nullable=True),
        sa.Column("ultimo_custo", sa.Numeric(12, 4), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "sessoes_cotacao",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("data_cotacao", sa.Date(), nullable=False, index=True),
        sa.Column("descricao", sa.String(200), nullable=True),
        sa.Column("arquivo_origem", sa.String(300), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "cotacoes",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("sessao_id", sa.Integer(), sa.ForeignKey("sessoes_cotacao.id", ondelete="CASCADE"), nullable=False),
        sa.Column("especificacao_id", sa.Integer(), sa.ForeignKey("especificacoes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("fornecedor_id", sa.Integer(), sa.ForeignKey("fornecedores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("preco", sa.Numeric(12, 4), nullable=False),
        sa.Column("posicao_planilha", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "pedidos",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("especificacao_id", sa.Integer(), sa.ForeignKey("especificacoes.id"), nullable=False),
        sa.Column("fornecedor_id", sa.Integer(), sa.ForeignKey("fornecedores.id"), nullable=False),
        sa.Column("cotacao_id", sa.Integer(), sa.ForeignKey("cotacoes.id"), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="cotando", index=True),
        sa.Column("quantidade", sa.Numeric(12, 4), nullable=False, server_default="1"),
        sa.Column("preco_cotado", sa.Numeric(12, 4), nullable=False),
        sa.Column("custo_planejado", sa.Numeric(12, 4), nullable=True),
        sa.Column("custo_comprado", sa.Numeric(12, 4), nullable=True),
        sa.Column("saving", sa.Numeric(12, 4), nullable=True),
        sa.Column("prazo_fornecedor", sa.Date(), nullable=True),
        sa.Column("data_pedido", sa.Date(), nullable=True),
        sa.Column("data_recebimento", sa.Date(), nullable=True),
        sa.Column("observacoes", sa.String(500), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("nome", sa.String(150), nullable=False),
        sa.Column("email", sa.String(200), nullable=False, unique=True, index=True),
        sa.Column("senha_hash", sa.String(300), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("usuarios")
    op.drop_table("pedidos")
    op.drop_table("cotacoes")
    op.drop_table("sessoes_cotacao")
    op.drop_table("especificacoes")
    op.drop_table("fornecedores")
    op.drop_table("categorias")
