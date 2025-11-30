# Script para limpar mensagens de commit
# Remove comentários explicativos das mensagens

Write-Host "🧹 Limpando mensagens de commit..." -ForegroundColor Cyan
Write-Host ""

# Verificar se há mudanças não commitadas
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  Há mudanças não commitadas. Fazendo stash..." -ForegroundColor Yellow
    git stash push -m "Stash antes de limpar commits"
    $stashMade = $true
} else {
    $stashMade = $false
}

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

Write-Host "📝 Mensagens que serão alteradas:" -ForegroundColor Cyan
Write-Host ""
foreach ($old in $mensagens.Keys) {
    Write-Host "  ❌ $old" -ForegroundColor Red
    Write-Host "  ✅ $($mensagens[$old])" -ForegroundColor Green
    Write-Host ""
}

Write-Host "⚠️  ATENÇÃO: Isso vai fazer FORCE PUSH no GitHub!" -ForegroundColor Red
Write-Host "⚠️  O histórico de commits será alterado!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Deseja continuar? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Operação cancelada." -ForegroundColor Yellow
    if ($stashMade) {
        git stash pop
    }
    exit
}

Write-Host ""
Write-Host "🔄 Iniciando rebase interativo..." -ForegroundColor Cyan
Write-Host ""

# Criar arquivo temporário com as instruções do rebase
$rebaseFile = ".git/rebase-todo-temp"
@"
reword 89834cb Melhorar visualmente tela de admin: login bonito com Enter, formulário de produtos aprimorado e lista de produtos melhorada
reword fc213e6 Adicionar logs detalhados para diagnosticar login Google que não funciona
reword e9f49ee Adicionar logs de debug e guia para corrigir VITE_API_BASE no Vercel
reword da37720 Adicionar guia para configurar Vercel (frontend) + Render (backend)
reword 8fbfceb Adicionar logs detalhados e validações para diagnosticar erro Google OAuth
reword 34aa748 Melhorar lógica do login Google: evitar popup desnecessário e reduzir avisos
reword c57ab8a Corrigir login manual para usar API real em vez de simulação
"@ | Out-File -FilePath $rebaseFile -Encoding utf8

Write-Host "ℹ️  Para editar os commits, você precisa fazer manualmente:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Execute: git rebase -i HEAD~7" -ForegroundColor Cyan
Write-Host "2. Mude 'pick' para 'reword' nos commits que quer editar" -ForegroundColor Cyan
Write-Host "3. Para cada commit, edite a mensagem para a versão limpa" -ForegroundColor Cyan
Write-Host "4. Salve e feche o editor" -ForegroundColor Cyan
Write-Host "5. Execute: git push --force-with-lease origin main" -ForegroundColor Cyan
Write-Host ""

if ($stashMade) {
    Write-Host "📦 Aplicando mudanças salvas de volta..." -ForegroundColor Cyan
    git stash pop
}

Write-Host ""
Write-Host "✅ Script concluído. Siga as instruções acima para completar." -ForegroundColor Green

