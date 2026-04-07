"""
Endpoint de upload e ingestão de planilha .xlsx.

Fluxo:
  1. Recebe o arquivo via multipart/form-data
  2. Parseia com openpyxl (colunas de fornecedor detectadas dinamicamente)
  3. Cria/atualiza Especificacoes, Fornecedores e Sessão de cotação
  4. Insere Cotacoes (preços por fornecedor)
  5. Retorna resumo da importação
"""

import tempfile
import traceback
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_usuario_atual
from app.etl.parser_xlsx import parsear_xlsx
from app.models.categoria import Categoria
from app.models.especificacao import Especificacao
from app.models.fornecedor import Fornecedor
from app.models.sessao_cotacao import SessaoCotacao
from app.models.cotacao import Cotacao

router = APIRouter()


def _obter_ou_criar_categoria(db: Session, nome: str) -> Categoria:
    cat = db.query(Categoria).filter(Categoria.nome == nome).first()
    if not cat:
        cat = Categoria(nome=nome)
        db.add(cat)
        db.flush()
    return cat


def _obter_ou_criar_fornecedor(db: Session, nome: str) -> Fornecedor:
    f = db.query(Fornecedor).filter(Fornecedor.nome == nome).first()
    if not f:
        f = Fornecedor(nome=nome)
        db.add(f)
        db.flush()
    return f


@router.post("/importar")
async def importar_planilha(
    arquivo: UploadFile = File(..., description="Arquivo .xlsx da planilha de cotação"),
    categoria_padrao: str = Form("Geral", description="Categoria usada quando não identificada"),
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual),
):
    """
    Importa planilha .xlsx e popula o banco de dados.
    Colunas de fornecedor são detectadas dinamicamente pelo cabeçalho.
    """
    if not arquivo.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Apenas arquivos .xlsx ou .xls são aceitos.")

    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        conteudo = await arquivo.read()
        tmp.write(conteudo)
        tmp_path = Path(tmp.name)

    try:
        linhas = parsear_xlsx(tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Erro ao ler planilha: {exc}")
    finally:
        tmp_path.unlink(missing_ok=True)

    if not linhas:
        raise HTTPException(status_code=422, detail="Planilha não contém dados válidos.")

    try:
        data_sessao_obj = date.fromisoformat(linhas[0].data_cotacao)
    except Exception:
        data_sessao_obj = date.today()

    try:
        sessao = SessaoCotacao(
            data_cotacao=data_sessao_obj,
            descricao=f"Importação: {arquivo.filename}",
            arquivo_origem=arquivo.filename,
        )
        db.add(sessao)
        db.flush()

        # Monta cache de fornecedores a partir dos nomes detectados na planilha
        nomes_fornecedores = linhas[0].nomes_fornecedores  # {posicao: nome}
        fornecedores_cache: dict[int, Fornecedor] = {
            pos: _obter_ou_criar_fornecedor(db, nome)
            for pos, nome in nomes_fornecedores.items()
        }

        categoria_padrao_obj = _obter_ou_criar_categoria(db, categoria_padrao)

        stats = {
            "especificacoes_criadas": 0,
            "especificacoes_atualizadas": 0,
            "cotacoes_inseridas": 0,
            "fornecedores_detectados": len(fornecedores_cache),
            "avisos": [],
        }

        for linha in linhas:
            stats["avisos"].extend(linha.erros)

            spec = db.query(Especificacao).filter(Especificacao.codigo == linha.codigo).first()
            if spec:
                if linha.custo_planejado is not None:
                    spec.custo_planejado = linha.custo_planejado
                if linha.ultimo_custo is not None:
                    spec.ultimo_custo = linha.ultimo_custo
                if linha.marca:
                    spec.marca = linha.marca
                stats["especificacoes_atualizadas"] += 1
            else:
                spec = Especificacao(
                    categoria_id=categoria_padrao_obj.id,
                    codigo=linha.codigo,
                    marca=linha.marca,
                    descricao=linha.descricao,
                    custo_planejado=linha.custo_planejado,
                    ultimo_custo=linha.ultimo_custo,
                )
                db.add(spec)
                db.flush()
                stats["especificacoes_criadas"] += 1

            for posicao, preco in linha.precos_fornecedores.items():
                fornecedor = fornecedores_cache.get(posicao)
                if not fornecedor:
                    continue
                cotacao = Cotacao(
                    sessao_id=sessao.id,
                    especificacao_id=spec.id,
                    fornecedor_id=fornecedor.id,
                    preco=preco,
                    posicao_planilha=posicao,
                )
                db.add(cotacao)
                stats["cotacoes_inseridas"] += 1

        db.commit()

        return {
            "sessao_id": sessao.id,
            "data_cotacao": str(data_sessao_obj),
            **stats,
        }

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno: {exc}\n{traceback.format_exc()}")
