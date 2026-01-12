# AVADA Consultoria - Deploy Rápido

## 🚀 Deploy em 5 Minutos (Railway)

### Pré-requisitos
- Conta no GitHub
- Conta no Railway (gratuita)

### Passos:

1. **Criar repositório no GitHub**
   ```bash
   git init
   git add .
   git commit -m "Deploy AVADA Consultoria"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/avada-consultoria.git
   git push -u origin main
   ```

2. **Deploy no Railway**
   - Acesse: https://railway.app/new
   - Clique em "Deploy from GitHub repo"
   - Selecione `avada-consultoria`
   - Aguarde o deploy automático

3. **Configurar Variáveis (IMPORTANTE)**
   - No Railway Dashboard → Variables
   - Adicione:
     ```
     JWT_SECRET=avada_super_secret_key_2024_production
     NODE_ENV=production
     ```

4. **Acessar aplicação**
   - Clique em "Settings" → "Generate Domain"
   - Sua URL: `https://avada-consultoria-production.up.railway.app`

### ✅ Pronto!
- Website: `https://seu-dominio.railway.app/`
- CRM: `https://seu-dominio.railway.app/crm.html`

### 🔐 Credenciais de Acesso:
- **Admin:** victorvitrine02@gmail.com / avada2024
- **Advogados:** email / advogado2024

---

## 📝 Comandos Git Úteis

```bash
# Verificar status
git status

# Adicionar novos arquivos
git add .

# Commit
git commit -m "Descrição da mudança"

# Push para produção (Railway faz deploy automático)
git push origin main
```

---

## 🆘 Problemas Comuns

**Erro ao fazer push:**
```bash
git pull origin main --rebase
git push origin main
```

**Mudar URL do Railway:**
- Dashboard → Settings → Domains → Generate Domain

**Ver logs de erro:**
- Dashboard → Deployments → View Logs

---

## 💡 Dica Pro

Instale Railway CLI para deploy direto do terminal:
```bash
npm install -g @railway/cli
railway login
railway up
```

🎉 **Seu projeto está no ar!**
