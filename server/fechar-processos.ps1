# Script para fechar processos Node.js e liberar portas

Write-Host "🔍 Procurando processos Node.js..." -ForegroundColor Yellow

# Fechar todos os processos Node.js
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "📦 Encontrados $($nodeProcesses.Count) processos Node.js" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   Fechando processo PID: $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Processos Node.js fechados!" -ForegroundColor Green
} else {
    Write-Host "✅ Nenhum processo Node.js encontrado" -ForegroundColor Green
}

# Verificar portas 4000 e 4001
Write-Host "`n🔍 Verificando portas 4000 e 4001..." -ForegroundColor Yellow

$port4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
$port4001 = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue

if ($port4000) {
    Write-Host "⚠️  Porta 4000 está em uso (PID: $($port4000.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $port4000.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "   Processo na porta 4000 fechado" -ForegroundColor Green
}

if ($port4001) {
    Write-Host "⚠️  Porta 4001 está em uso (PID: $($port4001.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $port4001.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "   Processo na porta 4001 fechado" -ForegroundColor Green
}

if (-not $port4000 -and -not $port4001) {
    Write-Host "✅ Portas 4000 e 4001 estão livres!" -ForegroundColor Green
}

Write-Host "`n✅ Pronto! Agora você pode iniciar o servidor." -ForegroundColor Green
Write-Host "   Execute: npm run dev" -ForegroundColor Cyan

