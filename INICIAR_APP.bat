@echo off
echo Iniciando Cierre de Caja Pro...
cd /d "%~dp0"
if not exist node_modules (
    echo Instalando dependencias por primera vez...
    call npm install
)
start "" http://localhost:3000
npm run dev
pause
