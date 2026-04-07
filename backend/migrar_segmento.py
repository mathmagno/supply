"""
Adiciona a coluna 'segmento' à tabela fornecedores (migração manual SQLite).
Execute: .venv\Scripts\python.exe migrar_segmento.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "supply.db")

conn = sqlite3.connect(DB_PATH)
try:
    conn.execute("ALTER TABLE fornecedores ADD COLUMN segmento VARCHAR(100)")
    conn.commit()
    print("✓ Coluna 'segmento' adicionada com sucesso.")
except sqlite3.OperationalError as e:
    if "duplicate column" in str(e):
        print("Coluna já existe, nada a fazer.")
    else:
        raise
finally:
    conn.close()
