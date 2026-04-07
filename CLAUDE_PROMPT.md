# Prompt — Sistema Supply (Gestão de Compras)

Você é um assistente especializado no sistema **Supply**, uma aplicação web de gestão de compras e supply chain desenvolvida do zero. Abaixo está tudo o que você precisa saber sobre o sistema para continuar seu desenvolvimento.

---

## 1. Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.13 + FastAPI + SQLAlchemy 2.0 |
| Banco de dados | SQLite (dev) · PostgreSQL/Supabase (prod) |
| Autenticação | JWT (python-jose) + passlib/bcrypt 3.2.2 |
| Parser de planilha | openpyxl (puro Python, sem pandas) |
| Frontend | React 18 + Vite + TypeScript |
| Estilo | Tailwind CSS + shadcn/ui |
| Estado/requisições | React Query v5 (TanStack Query) |
| Drag & drop | @dnd-kit |
| Gráficos | Recharts |

---

## 2. Estrutura de pastas

```
supply/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS + lifespan
│   │   ├── database.py          # Engine SQLite/PostgreSQL (condicional)
│   │   ├── auth.py              # JWT + AUTH_DISABLED=True (dev)
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── models/              # ORM SQLAlchemy
│   │   │   ├── categoria.py
│   │   │   ├── especificacao.py
│   │   │   ├── fornecedor.py
│   │   │   ├── sessao_cotacao.py
│   │   │   ├── cotacao.py
│   │   │   ├── pedido.py
│   │   │   └── usuario.py
│   │   ├── schemas/             # Pydantic v2 (request/response)
│   │   ├── routes/              # Endpoints FastAPI
│   │   │   ├── etl.py           # Upload .xlsx
│   │   │   ├── cotacoes.py      # Sessões + comparativo
│   │   │   ├── pedidos.py       # CRUD + Kanban
│   │   │   ├── fornecedores.py  # CRUD + modelo xlsx + lead time
│   │   │   ├── especificacoes.py
│   │   │   ├── categorias.py
│   │   │   ├── dashboard.py     # Saving + histórico + resumo
│   │   │   └── auth.py
│   │   └── etl/
│   │       └── parser_xlsx.py   # Parser dinâmico de colunas
│   ├── supply.db                # Banco SQLite local
│   ├── .env                     # DATABASE_URL, JWT_SECRET_KEY etc.
│   ├── requirements.txt
│   ├── seed_fornecedores.py     # 40 fornecedores fictícios (5 segmentos × 8)
│   ├── migrar_segmento.py       # ALTER TABLE: coluna segmento
│   └── migrar_whatsapp.py       # ALTER TABLE: coluna whatsapp
└── frontend/
    └── src/
        ├── pages/               # LoginPage, DashboardPage, CotacaoPage,
        │                        # KanbanPage, HistoricoPage, ImportacaoPage,
        │                        # CategoriasPage, EspecificacoesPage, FornecedoresPage
        ├── hooks/               # useFornecedores, useCotacoes, usePedidos...
        ├── components/
        │   ├── layout/          # Sidebar, Header, Layout
        │   └── ui/              # shadcn/ui components
        └── lib/
            ├── api.ts           # Axios + interceptor AUTH_DISABLED
            └── types.ts         # Interfaces TypeScript
```

---

## 3. Modelo de dados

### `categorias` — agrupamento de produtos
- `id`, `nome`, `criado_em`

### `especificacoes` — produtos/itens do catálogo
- `id`, `categoria_id`, `codigo` (único, ex: "mmic01"), `marca`, `descricao`
- `custo_planejado` (orçamento aprovado), `ultimo_custo` (histórico)

### `fornecedores` — lojas/empresas fornecedoras
- `id`, `nome`, `segmento` (ex: "TI", "Construção"), `contato`, `whatsapp`
- `lead_time_dias` (manual, legado) — **calculado automaticamente** pelo Kanban
- `ativo` (1/0)

### `sessoes_cotacao` — cada importação de planilha é uma sessão
- `id`, `data_cotacao`, `descricao`, `arquivo_origem`

### `cotacoes` — preços por fornecedor por item por sessão
- `id`, `sessao_id`, `especificacao_id`, `fornecedor_id`, `preco`, `posicao_planilha`

### `pedidos` — ordens de compra
- `id`, `especificacao_id`, `fornecedor_id`, `status`, `quantidade`
- `preco_cotado`, `custo_planejado`, `custo_comprado`, `saving`
- `prazo_fornecedor`, `data_pedido`, `data_recebimento`, `observacoes`

### `usuarios` — autenticação
- `id`, `nome`, `email`, `senha_hash`, `ativo`

---

## 4. Regras de negócio — Supply Chain & Logística

### 4.1 Cotação Comparativa (RFQ — Request for Quotation)
- Cada planilha `.xlsx` importada gera uma **Sessão de Cotação** com data e nome do arquivo
- A planilha tem colunas fixas: `Data | produto | marca | especificacao | Custo planejado | Último custo`
- A partir da coluna G, **qualquer número de colunas de fornecedor é detectado automaticamente** pelo cabeçalho (ex: "fornecedor 1", "fornecedor 7", "TechStore Brasil")
- O sistema destaca automaticamente o **menor preço** entre todos os fornecedores para cada item
- Múltiplas sessões de cotação podem ser comparadas ao longo do tempo (histórico de preços)

### 4.2 Saving (Economia em Compras)
- **Saving = Custo Planejado − Custo Comprado**
- Calculado automaticamente quando um pedido é marcado como **Recebido** no Kanban
- Saving positivo = compra abaixo do orçamento (meta atingida)
- Saving negativo = custo acima do planejado (alerta)
- Dashboards exibem saving total, por fornecedor e por produto

### 4.3 Kanban de Pedidos (Fluxo de Compra)
O pedido percorre 5 estágios obrigatórios em sequência:

```
Cotando → Aprovado → Pedido Emitido → Em Trânsito → Recebido
```

- **Cotando**: item identificado, aguardando aprovação de orçamento
- **Aprovado**: orçamento aprovado, pedido ainda não emitido ao fornecedor
- **Pedido Emitido**: ordem de compra enviada ao fornecedor
- **Em Trânsito**: mercadoria despachada, aguardando chegada
- **Recebido**: item entregue, saving calculado, lead time atualizado

Alertas visuais no Kanban:
- 🔴 **Prazo vencido**: `prazo_fornecedor < hoje` e status ≠ Recebido
- 🟡 **Prazo próximo**: entrega prometida nos próximos 3 dias

### 4.4 Lead Time (Prazo de Entrega)
- Definição: dias entre `data_pedido` e `data_recebimento`
- Calculado automaticamente como **média real** de todos os pedidos com status Recebido do fornecedor
- Exibido no card do fornecedor com indicador `(real)` quando vem do Kanban
- Usado para avaliar confiabilidade e pontualidade do fornecedor

### 4.5 Gestão de Fornecedores por Segmento
- Fornecedores são agrupados por **segmento de mercado** (TI, Construção, Alimentos, Móveis, Eletrodomésticos etc.)
- Cada segmento tem uma **planilha modelo gerada automaticamente** com os nomes reais dos fornecedores como cabeçalho (em vez de "fornecedor 1, 2, 3...")
- O comprador baixa a planilha modelo → preenche os preços → importa de volta → sistema cria a sessão de cotação

### 4.6 Histórico de Preços
- Cada importação de planilha registra os preços por fornecedor por item com data
- O sistema traça gráficos de série temporal de preço por fornecedor
- Permite identificar tendências de alta/baixa e negociar com base em histórico

### 4.7 Calculadora de Pedido (multi-item)
- Na tela de Cotação, o comprador seleciona o fornecedor desejado para cada item
- Pode informar a quantidade de cada item
- O sistema calcula o total por fornecedor e o total geral em tempo real
- Ao confirmar, gera automaticamente os pedidos no Kanban

---

## 5. Decisões técnicas importantes

### Autenticação desabilitada em desenvolvimento
```python
# backend/app/auth.py
AUTH_DISABLED = True  # retorna usuário fictício sem validar token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
```
```typescript
// frontend/src/lib/api.ts
const token = localStorage.getItem("token") ?? "dev-token";
```
Para reativar: `AUTH_DISABLED = False` no backend + restaurar guard no `App.tsx`.

### SQLite condicional (sem pool)
```python
# database.py — SQLite não suporta pool_size/max_overflow
if _is_sqlite:
    engine = create_engine(url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(url, pool_pre_ping=True, pool_size=10, max_overflow=20)
```

### Parser dinâmico de planilha
O `parser_xlsx.py` detecta fornecedores pelo cabeçalho a partir da coluna G — qualquer nome de coluna não-vazia é tratado como fornecedor. Não há limite fixo de fornecedores por planilha.

### Migrações manuais (SQLite)
Como o projeto usa SQLite em dev (sem Alembic ativo), novas colunas são adicionadas via scripts Python:
- `migrar_segmento.py` — coluna `segmento` em fornecedores
- `migrar_whatsapp.py` — coluna `whatsapp` em fornecedores

### bcrypt fixado em 3.2.2
```
bcrypt==3.2.2  # versões 4.x são incompatíveis com passlib 1.7.4
```

---

## 6. Como rodar o sistema

```powershell
# Backend (pasta backend/)
.\.venv\Scripts\uvicorn.exe app.main:app --reload

# Popular fornecedores de exemplo (primeira vez)
.\.venv\Scripts\python.exe migrar_segmento.py
.\.venv\Scripts\python.exe migrar_whatsapp.py
.\.venv\Scripts\python.exe seed_fornecedores.py

# Frontend (pasta frontend/)
npm run dev
```

URLs:
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/v1
- Docs Swagger: http://localhost:8000/docs

---

## 7. Endpoints principais da API

| Método | URL | Descrição |
|--------|-----|-----------|
| POST | `/api/v1/etl/importar` | Upload de planilha .xlsx |
| GET | `/api/v1/cotacoes/comparativa?sessao_id=` | Tabela comparativa de preços |
| GET | `/api/v1/cotacoes/sessoes` | Lista sessões de cotação |
| DELETE | `/api/v1/cotacoes/sessoes/{id}` | Remove sessão + cotações |
| GET | `/api/v1/pedidos/kanban` | Board Kanban por status |
| PATCH | `/api/v1/pedidos/{id}` | Atualiza status/dados do pedido |
| GET | `/api/v1/fornecedores/` | Lista com lead time calculado |
| GET | `/api/v1/fornecedores/modelo-xlsx?segmento=` | Gera planilha modelo |
| GET | `/api/v1/fornecedores/segmentos` | Lista segmentos distintos |
| GET | `/api/v1/dashboard/saving` | Saving total + por fornecedor/produto |
| GET | `/api/v1/dashboard/resumo` | Cards do dashboard |
| GET | `/api/v1/dashboard/historico-precos/{id}` | Série temporal de preços |
