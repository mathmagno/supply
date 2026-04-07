Write-Host "Criando ambiente virtual com Python 3.13..." -ForegroundColor Cyan
py -3.13 -m venv .venv

Write-Host "Atualizando pip..." -ForegroundColor Cyan
.\.venv\Scripts\python.exe -m pip install --upgrade pip

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
.\.venv\Scripts\pip.exe install -r requirements.txt

Write-Host ""
Write-Host "OK! Iniciando backend..." -ForegroundColor Green
.\.venv\Scripts\uvicorn.exe app.main:app --reload
