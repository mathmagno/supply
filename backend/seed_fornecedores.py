"""
Script para popular o banco com fornecedores fictícios de exemplo.
Execute: .venv\Scripts\python.exe seed_fornecedores.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.fornecedor import Fornecedor

Base.metadata.create_all(bind=engine)

FORNECEDORES = [
    # TI
    {"segmento": "TI", "nome": "TechStore Brasil", "contato": "contato@techstore.com.br", "lead_time_dias": 5},
    {"segmento": "TI", "nome": "InfoParts Distribuidora", "contato": "vendas@infoparts.com.br", "lead_time_dias": 7},
    {"segmento": "TI", "nome": "Digital Supply Co.", "contato": "digital@supply.com.br", "lead_time_dias": 3},
    {"segmento": "TI", "nome": "CompuMax Atacado", "contato": "atacado@compumax.com.br", "lead_time_dias": 10},
    {"segmento": "TI", "nome": "NetTech Soluções", "contato": "contato@nettech.com.br", "lead_time_dias": 4},
    {"segmento": "TI", "nome": "Pixel Hardware", "contato": "pixel@hardware.com.br", "lead_time_dias": 6},
    {"segmento": "TI", "nome": "ByteShop Equipamentos", "contato": "byte@shop.com.br", "lead_time_dias": 8},
    {"segmento": "TI", "nome": "CloudTech Importados", "contato": "cloud@tech.com.br", "lead_time_dias": 15},
    # Construção
    {"segmento": "Construção", "nome": "Construfácil Material", "contato": "vendas@construfacil.com.br", "lead_time_dias": 2},
    {"segmento": "Construção", "nome": "AçoFlex Distribuidora", "contato": "acoflex@dist.com.br", "lead_time_dias": 5},
    {"segmento": "Construção", "nome": "MegaObra Atacado", "contato": "megaobra@atacado.com.br", "lead_time_dias": 3},
    {"segmento": "Construção", "nome": "Cimento & Cia", "contato": "contato@cimentoecia.com.br", "lead_time_dias": 1},
    {"segmento": "Construção", "nome": "Tintas Horizonte", "contato": "tintas@horizonte.com.br", "lead_time_dias": 4},
    {"segmento": "Construção", "nome": "Ferragem Total", "contato": "ferragem@total.com.br", "lead_time_dias": 2},
    {"segmento": "Construção", "nome": "Hidráulica Express", "contato": "hidro@express.com.br", "lead_time_dias": 3},
    {"segmento": "Construção", "nome": "ElétricaMax", "contato": "eletrica@max.com.br", "lead_time_dias": 2},
    # Alimentos
    {"segmento": "Alimentos", "nome": "FoodSupply Brasil", "contato": "food@supply.com.br", "lead_time_dias": 1},
    {"segmento": "Alimentos", "nome": "Distribuidora Sabor", "contato": "sabor@dist.com.br", "lead_time_dias": 2},
    {"segmento": "Alimentos", "nome": "FrigoMax Carnes", "contato": "frigo@max.com.br", "lead_time_dias": 1},
    {"segmento": "Alimentos", "nome": "HortFresh Orgânicos", "contato": "hort@fresh.com.br", "lead_time_dias": 1},
    {"segmento": "Alimentos", "nome": "Laticínios Beira Rio", "contato": "laticinios@beirario.com.br", "lead_time_dias": 2},
    {"segmento": "Alimentos", "nome": "Padaria Central Atacado", "contato": "padaria@central.com.br", "lead_time_dias": 1},
    {"segmento": "Alimentos", "nome": "Bebidas & Mais", "contato": "bebidas@mais.com.br", "lead_time_dias": 3},
    {"segmento": "Alimentos", "nome": "Granel Distribuidora", "contato": "granel@dist.com.br", "lead_time_dias": 2},
    # Móveis
    {"segmento": "Móveis", "nome": "MóveisBR Atacado", "contato": "moveis@br.com.br", "lead_time_dias": 20},
    {"segmento": "Móveis", "nome": "Madeira & Design", "contato": "madeira@design.com.br", "lead_time_dias": 15},
    {"segmento": "Móveis", "nome": "Flex Estofados", "contato": "flex@estofados.com.br", "lead_time_dias": 25},
    {"segmento": "Móveis", "nome": "Planejados Express", "contato": "plan@express.com.br", "lead_time_dias": 30},
    {"segmento": "Móveis", "nome": "AluMóveis Corporativos", "contato": "alu@moveis.com.br", "lead_time_dias": 18},
    {"segmento": "Móveis", "nome": "EcoWood Sustentável", "contato": "eco@wood.com.br", "lead_time_dias": 22},
    {"segmento": "Móveis", "nome": "Confort Office", "contato": "confort@office.com.br", "lead_time_dias": 12},
    {"segmento": "Móveis", "nome": "ModularHaus", "contato": "modular@haus.com.br", "lead_time_dias": 16},
    # Eletrodomésticos
    {"segmento": "Eletrodomésticos", "nome": "EletroAtacado Nacional", "contato": "eletro@atacado.com.br", "lead_time_dias": 10},
    {"segmento": "Eletrodomésticos", "nome": "Casa Eletrônica", "contato": "casa@eletronica.com.br", "lead_time_dias": 7},
    {"segmento": "Eletrodomésticos", "nome": "Linha Branca Dist.", "contato": "linhab@dist.com.br", "lead_time_dias": 12},
    {"segmento": "Eletrodomésticos", "nome": "EletroFrio Express", "contato": "eletrofrio@exp.com.br", "lead_time_dias": 8},
    {"segmento": "Eletrodomésticos", "nome": "Cozinha Total", "contato": "cozinha@total.com.br", "lead_time_dias": 5},
    {"segmento": "Eletrodomésticos", "nome": "SmartHome Brasil", "contato": "smart@home.com.br", "lead_time_dias": 14},
    {"segmento": "Eletrodomésticos", "nome": "VoltMax Distribuidora", "contato": "volt@max.com.br", "lead_time_dias": 9},
    {"segmento": "Eletrodomésticos", "nome": "PowerSupply Eletrônicos", "contato": "power@supply.com.br", "lead_time_dias": 11},
]

def seed():
    db = SessionLocal()
    try:
        criados = 0
        for dados in FORNECEDORES:
            existe = db.query(Fornecedor).filter(Fornecedor.nome == dados["nome"]).first()
            if not existe:
                db.add(Fornecedor(**dados))
                criados += 1
        db.commit()
        print(f"✓ {criados} fornecedores criados ({len(FORNECEDORES) - criados} já existiam).")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
