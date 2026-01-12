# AVADA Consultoria - Guia de Deploy

## 🚀 Opções de Deploy

Este projeto fullstack pode ser implantado em várias plataformas. Devido ao uso do SQLite, **Railway** e **Render** são as opções mais adequadas.

## ⚠️ Importante: Banco de Dados

**SQLite não funciona na Vercel** (ambiente serverless sem persistência de arquivos). Para Vercel, seria necessário migrar para PostgreSQL/MySQL.

## 🎯 Opção 1: Railway (RECOMENDADO)

Railway é ideal para este projeto pois suporta SQLite nativamente e é gratuito para começar.

### Passos para Deploy no Railway:

1. **Criar conta no Railway**
   - Acesse: https://railway.app/
   - Faça login com GitHub

2. **Instalar Railway CLI** (opcional)
   ```bash
   npm install -g @railway/cli
   ```

3. **Fazer Deploy via GitHub**
   - Crie um repositório no GitHub
   - Faça push do código:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin [URL_DO_SEU_REPO]
     git push -u origin main
     ```
   
   - No Railway Dashboard:
     - Clique em "New Project"
     - Selecione "Deploy from GitHub repo"
     - Escolha seu repositório
     - Railway detectará automaticamente o Node.js

4. **Configurar Variáveis de Ambiente**
   No Railway Dashboard, vá em "Variables" e adicione:
   ```
   JWT_SECRET=sua_chave_secreta_super_segura_aqui
   NODE_ENV=production
   PORT=3000
   ```

5. **Deploy Automático**
   - Railway fará o deploy automaticamente
   - Você receberá uma URL pública (ex: `avada-consultoria.up.railway.app`)

### Comandos Railway CLI (Alternativa):
```bash
# Login
railway login

# Link ao projeto
railway init

# Deploy
railway up

# Ver logs
railway logs
```

---

## 🎯 Opção 2: Render

Render também é excelente e oferece plano gratuito.

### Passos para Deploy no Render:

1. **Criar conta no Render**
   - Acesse: https://render.com/
   - Faça login com GitHub

2. **Criar Web Service**
   - Dashboard → "New" → "Web Service"
   - Conecte seu repositório GitHub
   - Configure:
     - **Name:** `avada-consultoria`
     - **Environment:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Plan:** Free

3. **Variáveis de Ambiente**
   Na seção "Environment", adicione:
   ```
   JWT_SECRET=sua_chave_secreta_super_segura_aqui
   NODE_ENV=production
   ```

4. **Deploy**
   - Render fará deploy automaticamente
   - URL: `https://avada-consultoria.onrender.com`

---

## 🎯 Opção 3: Vercel (Requer Migração de Banco)

⚠️ **Atenção:** Vercel não suporta SQLite. Você precisaria migrar para PostgreSQL (Supabase, Neon, etc.)

### Se optar por migrar para PostgreSQL:

1. **Criar banco PostgreSQL gratuito:**
   - Supabase: https://supabase.com/
   - Neon: https://neon.tech/
   - ElephantSQL: https://www.elephantsql.com/

2. **Instalar dependência:**
   ```bash
   npm install pg
   ```

3. **Atualizar `server/database.js`** para usar PostgreSQL

4. **Deploy na Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

5. **Configurar variáveis no Vercel Dashboard:**
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   JWT_SECRET=sua_chave_secreta
   ```

---

## 📦 Preparação Local Antes do Deploy

### 1. Criar `.gitignore` (se ainda não existe):
```
node_modules/
.env
*.sqlite
*.log
.DS_Store
```

### 2. Verificar `package.json`:
Certifique-se que tem o script de start:
```json
{
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js"
  }
}
```

### 3. Testar localmente em modo produção:
```bash
NODE_ENV=production npm start
```

---

## 🔒 Segurança em Produção

### Variáveis de Ambiente Obrigatórias:
- `JWT_SECRET` - Chave secreta forte (mínimo 32 caracteres)
- `NODE_ENV=production`
- `PORT` (opcional, a plataforma geralmente define)

### Gerar JWT_SECRET forte:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Monitoramento Pós-Deploy

Após o deploy, teste:

1. **Website:** `https://seu-dominio.com/`
   - Verifique páginas: Home, Serviços, Sobre, Contato

2. **CRM:** `https://seu-dominio.com/crm.html`
   - Teste login com admin
   - Verifique cadastros funcionando

3. **API:** `https://seu-dominio.com/api/auth/login`
   - Teste endpoints

---

## 🆘 Troubleshooting

### Erro: "Cannot find module"
- Verifique se todas as dependências estão em `dependencies` (não em `devDependencies`)
- Execute `npm install` novamente

### Erro: "Database locked" (SQLite)
- Normal em cold starts
- Considere adicionar retry logic ou migrar para PostgreSQL

### Erro: "EADDRINUSE"
- Certifique-se que a variável `PORT` está configurada corretamente
- Use `process.env.PORT || 3000` no código

---

## 🎉 Checklist de Deploy

- [ ] Código commitado no GitHub
- [ ] `.env` no `.gitignore`
- [ ] Variáveis de ambiente configuradas na plataforma
- [ ] `JWT_SECRET` forte definido
- [ ] Build testado localmente
- [ ] Deploy realizado com sucesso
- [ ] Website acessível
- [ ] CRM funcionando
- [ ] Login testado
- [ ] Cadastros funcionando

---

## 📞 Próximos Passos

### Opcional: Domínio Personalizado
1. Compre um domínio (ex: Namecheap, GoDaddy)
2. Configure DNS na plataforma escolhida
3. Adicione certificado SSL (automático na maioria das plataformas)

### Opcional: CI/CD
- GitHub Actions para testes automatizados
- Deploy automático em cada push

---

**Recomendação Final:** Use **Railway** para começar. É gratuito, fácil, e funciona perfeitamente com SQLite!

🚀 **Comando rápido Railway:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Boa sorte com seu deploy! 🎉
