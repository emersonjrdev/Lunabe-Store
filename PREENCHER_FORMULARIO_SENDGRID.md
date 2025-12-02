# Como Preencher o Formulário do SendGrid

## 📝 Campos Obrigatórios (marcados com ponto vermelho •)

Preencha o formulário com os seguintes dados:

### 1. **De Nome** (From Name) - OBRIGATÓRIO
```
Lunabe Pijamas
```
⚠️ Este campo está com erro! Preencha com o nome acima.

### 2. **Do endereço de e-mail** (From Email Address) - OBRIGATÓRIO
```
lunabepijamas@gmail.com
```
✅ Este é o email oficial do Lunabe - use este!

### 3. **Responder a** (Reply To) - OBRIGATÓRIO
```
lunabepijamas@gmail.com
```
✅ Use o mesmo email acima.

### 4. **Endereço da empresa** (Company Address) - OBRIGATÓRIO
```
Rua José Ribeiro da Silva
```

### 5. **Endereço da empresa - Linha 2** (Company Address Line 2) - OPCIONAL
```
Jardim Portão Vermelho
```

### 6. **Cidade** (City) - OBRIGATÓRIO
```
Vargem Grande Paulista
```

### 7. **Estado** (State) - OBRIGATÓRIO
```
São Paulo
```
Ou selecione "SP" no dropdown.

### 8. **CEP** (ZIP Code)
```
06735-322
```

### 9. **País** (Country) - OBRIGATÓRIO
```
Brazil
```
Ou selecione "Brasil" no dropdown.

### 10. **Apelido** (Nickname) - OBRIGATÓRIO
```
Lunabe
```
Ou "Lunabe Pijamas" - é apenas um nome interno para identificar.

## ✅ Após Preencher

1. Clique em **"Criar"** (Create) no final do formulário
2. O SendGrid enviará um email de verificação para o endereço que você colocou em "Do endereço de e-mail"
3. **Acesse a caixa de entrada desse email**
4. Clique no link de verificação
5. Pronto! O remetente estará verificado

## ⚠️ Importante

- O campo **"De Nome"** está com erro - preencha com "Lunabe Pijamas"
- Use um email que você tenha acesso para verificar
- Todos os campos com ponto vermelho (•) são obrigatórios

## 📧 Depois de Verificar

Após verificar o email, configure no Render:
- **Key:** `EMAIL_FROM`
- **Value:** `Lunabe Pijamas <lunabepijamas@gmail.com>`
  - ✅ Use o email que você verificou: `lunabepijamas@gmail.com`

