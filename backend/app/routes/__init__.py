from fastapi import APIRouter
from .auth import router as auth_router
from .categorias import router as categorias_router
from .especificacoes import router as especificacoes_router
from .fornecedores import router as fornecedores_router
from .cotacoes import router as cotacoes_router
from .pedidos import router as pedidos_router
from .dashboard import router as dashboard_router
from .etl import router as etl_router

api_router = APIRouter()

api_router.include_router(auth_router,           prefix="/auth",           tags=["Auth"])
api_router.include_router(categorias_router,     prefix="/categorias",     tags=["Categorias"])
api_router.include_router(especificacoes_router, prefix="/especificacoes", tags=["Especificações"])
api_router.include_router(fornecedores_router,   prefix="/fornecedores",   tags=["Fornecedores"])
api_router.include_router(cotacoes_router,       prefix="/cotacoes",       tags=["Cotações"])
api_router.include_router(pedidos_router,        prefix="/pedidos",        tags=["Pedidos"])
api_router.include_router(dashboard_router,      prefix="/dashboard",      tags=["Dashboard"])
api_router.include_router(etl_router,            prefix="/etl",            tags=["ETL"])
