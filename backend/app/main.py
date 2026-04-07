from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routes import api_router

# Importa todos os models para garantir que as tabelas sejam criadas
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Cria tabelas no banco ao iniciar (desenvolvimento). Em prod, use Alembic."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sistema de Gestão de Compras",
    description="API REST para cotação, pedidos e análise de saving.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rotas ─────────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
