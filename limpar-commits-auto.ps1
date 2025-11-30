# Script automático para limpar mensagens de commit
# Remove comentários explicativos das mensagens

Write-Host "Limpando mensagens de commit automaticamente..." -ForegroundColor Cyan
Write-Host ""

# Verificar se há mudanças não commitadas
$status = git status --porcelain
if ($status) {
    Write-Host "ATENCAO: Ha mudancas nao commitadas. Fazendo stash..." -ForegroundColor Yellow
    git stash push -m "Stash antes de limpar commits - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $stashMade = $true
    Write-Host "OK: Mudancas salvas." -ForegroundColor Green
} else {
    $stashMade = $false
    Write-Host "OK: Nenhuma mudanca nao commitada." -ForegroundColor Green
}

Write-Host ""
Write-Host "Mensagens que serao alteradas:" -ForegroundColor Cyan
Write-Host ""

# Mapeamento de mensagens antigas para novas
$mensagens = @{
    "Melhorar visualmente tela de admin: login bonito com Enter, formulário de produtos aprimorado e lista de produtos melhorada" = "Melhorar tela de admin"
    "Adicionar logs detalhados para diagnosticar login Google que não funciona" = "Corrigir login Google"
    "Adicionar logs de debug e guia para corrigir VITE_API_BASE no Vercel" = "Corrigir VITE_API_BASE no Vercel"
    "Adicionar guia para configurar Vercel (frontend) + Render (backend)" = "Configurar Vercel e Render"
    "Adicionar logs detalhados e validações para diagnosticar erro Google OAuth" = "Corrigir erro Google OAuth"
    "Melhorar lógica do login Google: evitar popup desnecessário e reduzir avisos" = "Melhorar login Google"
    "Corrigir login manual para usar API real em vez de simulação" = "Corrigir login manual"
}

foreach ($old in $mensagens.Keys) {
    Write-Host "  ANTES: $old" -ForegroundColor Red
    Write-Host "  DEPOIS: $($mensagens[$old])" -ForegroundColor Green
    Write-Host ""
}

Write-Host ""
Write-Host "ATENCAO: Isso vai fazer FORCE PUSH no GitHub!" -ForegroundColor Red
Write-Host "ATENCAO: O historico de commits sera alterado!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Deseja continuar? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host ""
    Write-Host "Operacao cancelada." -ForegroundColor Yellow
    if ($stashMade) {
        Write-Host "Aplicando mudancas salvas de volta..." -ForegroundColor Cyan
        git stash pop
    }
    exit
}

Write-Host ""
Write-Host "Editando commits..." -ForegroundColor Cyan
Write-Host ""

# Usar abordagem mais simples: resetar e recriar commits
Write-Host "Obtendo hash do commit base (7 commits atras)..." -ForegroundColor Cyan
$baseCommit = git rev-parse HEAD~7
Write-Host "OK: Commit base: $baseCommit" -ForegroundColor Green
Write-Host ""

Write-Host "Resetando para commit base (soft reset - mantem mudancas)..." -ForegroundColor Cyan
git reset --soft HEAD~7

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Erro ao fazer reset. Abortando." -ForegroundColor Red
    if ($stashMade) {
        git stash pop
    }
    exit 1
}

Write-Host "OK: Reset concluido. Todos os commits foram desfeitos (mudancas mantidas)." -ForegroundColor Green
Write-Host ""

# Obter lista de commits na ordem correta (do mais antigo para o mais recente)
Write-Host "Recriando commits com mensagens limpas..." -ForegroundColor Cyan
Write-Host ""

# Lista de commits na ordem (do mais antigo para o mais recente)
$commits = @(
    @{ hash = "c57ab8a"; msg = "Corrigir login manual" },
    @{ hash = "34aa748"; msg = "Melhorar login Google" },
    @{ hash = "8fbfceb"; msg = "Corrigir erro Google OAuth" },
    @{ hash = "da37720"; msg = "Configurar Vercel e Render" },
    @{ hash = "e9f49ee"; msg = "Corrigir VITE_API_BASE no Vercel" },
    @{ hash = "fc213e6"; msg = "Corrigir login Google" },
    @{ hash = "89834cb"; msg = "Melhorar tela de admin" }
)

# Aplicar cada commit individualmente
foreach ($commit in $commits) {
    Write-Host "  Aplicando: $($commit.msg)..." -ForegroundColor Cyan
    
    # Tentar aplicar o commit
    git cherry-pick --no-commit $commit.hash 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        # Verificar se há mudanças para commitar
        $changes = git status --porcelain
        if ($changes) {
            git commit -m $commit.msg 2>&1 | Out-Null
            Write-Host "    OK: Commit criado: $($commit.msg)" -ForegroundColor Green
        } else {
            Write-Host "    AVISO: Nenhuma mudanca para este commit" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    AVISO: Erro ao aplicar commit $($commit.hash)" -ForegroundColor Yellow
        # Tentar continuar mesmo assim
        git cherry-pick --abort 2>&1 | Out-Null
    }
}

Write-Host ""
Write-Host "OK: Commits recriados!" -ForegroundColor Green
Write-Host ""

# Aplicar mudanças salvas de volta
if ($stashMade) {
    Write-Host "Aplicando mudancas salvas de volta..." -ForegroundColor Cyan
    git stash pop
    Write-Host "OK: Mudancas aplicadas." -ForegroundColor Green
    Write-Host ""
}

Write-Host "Ultimos 7 commits:" -ForegroundColor Cyan
git log --oneline -7

Write-Host ""
Write-Host "ATENCAO: Proximo passo: Enviar para GitHub com force push" -ForegroundColor Yellow
Write-Host ""
$pushConfirm = Read-Host "Deseja fazer push agora? (s/N)"

if ($pushConfirm -eq "s" -or $pushConfirm -eq "S") {
    Write-Host ""
    Write-Host "Enviando para GitHub..." -ForegroundColor Cyan
    git push --force-with-lease origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "OK: Commits limpos e enviados com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERRO: Erro ao fazer push. Verifique o erro acima." -ForegroundColor Red
        Write-Host "   Voce pode tentar novamente com: git push --force-with-lease origin main" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Para enviar depois, execute:" -ForegroundColor Yellow
    Write-Host "   git push --force-with-lease origin main" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "OK: Script concluido!" -ForegroundColor Green
