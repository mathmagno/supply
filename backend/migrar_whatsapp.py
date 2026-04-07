"""
Adiciona coluna 'whatsapp' à tabela fornecedores.
Execute: .venv\Scripts\python.exe migrar_whatsapp.py
"""
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "supply.db")
conn = sqlite3.connect(DB_PATH)
try:
    conn.execute("ALTER TABLE fornecedores ADD COLUMN whatsapp VARCHAR(20)")
    conn.commit()
    print("✓ Coluna 'whatsapp' adicionada com sucesso.")
except sqlite3.OperationalError as e:
    print("Coluna já existe." if "duplicate column" in str(e) else str(e))
finally:
    conn.close()
