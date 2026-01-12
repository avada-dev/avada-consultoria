# 🌐 Deploy na Hostinger - Guia Completo

## ⚠️ IMPORTANTE: Qual plano você precisa?

### ❌ Hospedagem Compartilhada (Não funciona)
Se você tem plano de hospedagem compartilhada (WordPress, sites HTML), **NÃO VAI FUNCIONAR** para este projeto.

**Por quê?** Este é um projeto Node.js que precisa rodar continuamente. Hospedagem compartilhada só aceita PHP/HTML estático.

### ✅ VPS Hostinger (Funciona perfeitamente)
Você precisa de um **VPS (Servidor Virtual Privado)** da Hostinger.

**Planos VPS Hostinger:**
- KVM 1: ~R$ 23/mês - Teste/desenvolvimento
- KVM 2: ~R$ 33/mês - Pequeno tráfego
- KVM 4: ~R$ 47/mês - Médio tráfego (RECOMENDADO)

---

## 🎯 Opção 1: Se você JÁ TEM VPS Hostinger

Ótimo! Siga os passos abaixo.

## 🎯 Opção 2: Se você NÃO TEM VPS

### Como contratar VPS na Hostinger:

1. **Acesse:** https://www.hostinger.com.br/vps-hospedagem
2. **Escolha um plano:** KVM 4 (recomendado para produção)
3. **Clique em "Adicionar ao carrinho"**
4. **Finalize a compra**
5. **Aguarde:** Você receberá um email com:
   - IP do servidor (ex: 123.45.67.89)
   - Usuário: root
   - Senha de acesso
6. **Guarde bem essas informações!**

---

## 📋 Pré-requisitos

Você vai precisar de:
- ✅ VPS Hostinger ativo
- ✅ IP do servidor
- ✅ Usuário e senha (do email da Hostinger)
- ✅ Computador com Windows (você já tem)

---

## 🚀 Passo 1: Conectar ao seu VPS

### 1.1 Baixar PuTTY (programa para conectar ao servidor)

1. Acesse: https://www.putty.org/
2. Baixe "putty.exe" (64-bit x86)
3. Execute o arquivo baixado
4. Não precisa instalar, só abrir

### 1.2 Conectar ao servidor

1. **No PuTTY:**
   - Host Name: `SEU_IP_AQUI` (exemplo: 123.45.67.89)
   - Port: `22`
   - Connection type: `SSH`
2. **Clique em "Open"**
3. **Aviso de segurança:** Clique em "Yes"
4. **Login as:** Digite `root` e pressione Enter
5. **Password:** Cole a senha que você recebeu por email
   - **Nota:** A senha não aparece quando você digita (é normal)
   - Pressione Enter
6. **Sucesso!** Você está dentro do servidor

---

## 🔧 Passo 2: Preparar o Servidor

### 2.1 Atualizar sistema (copie e cole cada linha)

```bash
apt update
apt upgrade -y
```
_(Aguarde 2-3 minutos)_

### 2.2 Instalar Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```
_(Aguarde 1-2 minutos)_

**Verificar se instalou:**
```bash
node --version
npm --version
```
_(Deve mostrar as versões)_

### 2.3 Instalar Git

```bash
apt install -y git
```

### 2.4 Instalar PM2 (gerenciador de processos)

```bash
npm install -g pm2
```

---

## 📦 Passo 3: Enviar seu código para o servidor

### Opção A: Usando Git (Recomendado)

**No seu computador (Prompt de Comando):**

1. Vá para a pasta do projeto:
   ```bash
   cd "C:\Users\Anderson Victor\.gemini\antigravity\scratch\avada-consultoria"
   ```

2. Criar repositório GitHub:
   - Acesse: https://github.com/new
   - Nome: `avada-consultoria`
   - Deixe privado
   - Clique em "Create repository"

3. Seguir as instruções que aparecem:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/avada-consultoria.git
   git branch -M main
   git push -u origin main
   ```

**No servidor (PuTTY):**

```bash
cd /var/www
git clone https://github.com/SEU_USUARIO/avada-consultoria.git
cd avada-consultoria
```

### Opção B: Usando FTP (Mais simples)

1. **Baixar FileZilla:** https://filezilla-project.org/
2. **Conectar:**
   - Host: `sftp://SEU_IP`
   - Usuário: `root`
   - Senha: `SUA_SENHA`
   - Porta: `22`
3. **Arrastar pasta do projeto:**
   - Do lado esquerdo (seu PC): navegue até a pasta do projeto
   - Do lado direito (servidor): vá para `/var/www/`
   - Arraste a pasta inteira para lá
4. **No PuTTY:**
   ```bash
   cd /var/www/avada-consultoria
   ```

---

## ⚙️ Passo 4: Configurar a Aplicação

**No servidor (PuTTY):**

### 4.1 Instalar dependências

```bash
npm install
```
_(Aguarde 2-3 minutos)_

### 4.2 Criar arquivo .env

```bash
nano .env
```

**Digite isso (substitua a chave):**
```
JWT_SECRET=sua_chave_super_secreta_forte_aqui_12345
NODE_ENV=production
PORT=3000
```

**Para salvar:**
- Pressione `Ctrl + O` (letra O)
- Pressione `Enter`
- Pressione `Ctrl + X`

### 4.3 Testar se funciona

```bash
npm start
```

Se aparecer a mensagem bonita do AVADA, está funcionando!

**Para parar:** Pressione `Ctrl + C`

---

## 🔄 Passo 5: Deixar rodando permanentemente

### 5.1 Iniciar com PM2

```bash
pm2 start server/server.js --name avada-crm
pm2 save
pm2 startup
```

**Copie** o comando que aparecer e **cole** de volta no terminal.

### 5.2 Verificar se está rodando

```bash
pm2 status
```

Deve mostrar "avada-crm" com status "online".

---

## 🌐 Passo 6: Configurar Nginx (Servidor Web)

### 6.1 Instalar Nginx

```bash
apt install -y nginx
```

### 6.2 Configurar site

```bash
nano /etc/nginx/sites-available/avada
```

**Cole isso (substitua SEU_DOMINIO.COM pelo seu domínio):**

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.COM www.SEU_DOMINIO.COM;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Se não tiver domínio ainda, use apenas o IP:**
```nginx
server {
    listen 80;
    server_name SEU_IP_AQUI;
    
    # ... resto igual
}
```

**Salvar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 6.3 Ativar configuração

```bash
ln -s /etc/nginx/sites-available/avada /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 🔒 Passo 7: Configurar Domínio (Opcional)

### Se você TEM domínio próprio:

1. **No painel da Hostinger:**
   - Vá em "Domínios"
   - Clique no seu domínio
   - DNS / Nameservers

2. **Adicionar registro A:**
   - Tipo: `A`
   - Nome: `@`
   - Aponta para: `SEU_IP_VPS`
   - TTL: `14400`

3. **Adicionar registro A para www:**
   - Tipo: `A`
   - Nome: `www`
   - Aponta para: `SEU_IP_VPS`
   - TTL: `14400`

4. **Aguardar:** 1-24 horas para propagar

### Adicionar HTTPS (SSL grátis):

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seudominio.com -d www.seudominio.com
```

Siga as instruções e escolha "2" (redirect HTTP to HTTPS).

---

## ✅ Passo 8: Testar Tudo

### 8.1 Acessar pelo IP (imediato)

1. Abra navegador
2. Digite: `http://SEU_IP`
3. Deve abrir o site AVADA!

### 8.2 Se configurou domínio

1. Abra navegador
2. Digite: `http://seudominio.com`
3. Deve abrir o site!

### 8.3 Testar CRM

1. Vá em: `http://SEU_IP/crm.html` (ou `http://seudominio.com/crm.html`)
2. Login:
   - Email: victorvitrine02@gmail.com
   - Senha: avada2024
3. Deve funcionar!

---

## 📊 Comandos Úteis

### Ver logs da aplicação:
```bash
pm2 logs avada-crm
```

### Reiniciar aplicação:
```bash
pm2 restart avada-crm
```

### Parar aplicação:
```bash
pm2 stop avada-crm
```

### Ver status:
```bash
pm2 status
```

### Atualizar código (se fez mudanças):
```bash
cd /var/www/avada-consultoria
git pull
npm install
pm2 restart avada-crm
```

---

## 🔥 Configurar Firewall (Segurança)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Digite `y` e pressione Enter.

---

## 💾 Fazer Backup do Banco de Dados

### Backup manual:

```bash
cp /var/www/avada-consultoria/server/database.sqlite /var/www/backup-$(date +%Y%m%d).sqlite
```

### Backup automático (diário):

```bash
crontab -e
```

Escolha `1` (nano).

Adicione no final:
```
0 2 * * * cp /var/www/avada-consultoria/server/database.sqlite /var/www/backup-$(date +\%Y\%m\%d).sqlite
```

Salvar: `Ctrl + O`, `Enter`, `Ctrl + X`

---

## 🆘 Resolução de Problemas

### Site não abre no navegador

**Soluções:**
```bash
# Verificar se o app está rodando
pm2 status

# Se não estiver, iniciar
pm2 start server/server.js --name avada-crm

# Verificar nginx
systemctl status nginx

# Reiniciar nginx
systemctl restart nginx
```

### Erro ao instalar dependências

```bash
# Limpar cache
npm cache clean --force
rm -rf node_modules
npm install
```

### Esqueceu a senha do servidor

- Acesse o painel da Hostinger
- VPS → Seu VPS → Reset Password
- Receberá nova senha por email

### Porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :3000

# Matar processo se necessário
pm2 delete all
pm2 start server/server.js --name avada-crm
```

---

## 💰 Custos Mensais

**VPS Hostinger KVM 4 (Recomendado):**
- R$ 47/mês (aproximadamente)
- Inclui: 4GB RAM, 2 CPUs, 50GB SSD
- Suficiente para centenas de acessos simultâneos

**Domínio (opcional):**
- R$ 40-60/ano (.com.br)
- R$ 60-100/ano (.com)

**SSL:** Grátis (Let's Encrypt)

**Total:** ~R$ 50-60/mês

---

## 🎉 Checklist Final

- [ ] VPS Hostinger contratado
- [ ] PuTTY instalado e conectado
- [ ] Node.js instalado no servidor
- [ ] Código enviado para o servidor
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo .env criado
- [ ] PM2 configurado
- [ ] Nginx instalado e configurado
- [ ] Site acessível pelo IP
- [ ] (Opcional) Domínio configurado
- [ ] (Opcional) SSL/HTTPS configurado
- [ ] CRM testado e funcionando
- [ ] Backup configurado

---

## 📞 Suporte Hostinger

Se tiver problemas com o VPS:
- Chat: https://www.hostinger.com.br/
- Suporte 24/7 em português
- Tutoriais: https://support.hostinger.com/

---

## 🔄 Comparação: Hostinger vs Google Cloud

| Aspecto | Hostinger VPS | Google Cloud |
|---------|---------------|--------------|
| **Facilidade** | ⭐⭐⭐ Médio | ⭐⭐⭐⭐ Fácil |
| **Custo** | ~R$ 47/mês fixo | ~R$ 0-30/mês variável |
| **Controle** | ⭐⭐⭐⭐⭐ Total | ⭐⭐⭐ Limitado |
| **Suporte** | ⭐⭐⭐⭐ Português 24/7 | ⭐⭐ Inglês |
| **Escalabilidade** | ⭐⭐⭐ Manual | ⭐⭐⭐⭐⭐ Automática |
| **Recomendado para** | Quem quer controle total | Quem quer facilidade |

---

## 🎓 Conclusão

**Vantagens da Hostinger:**
✅ Suporte em português 24/7  
✅ Custo fixo previsível  
✅ Controle total do servidor  
✅ Bom para aprender Linux  

**Desvantagens:**
❌ Requer conhecimento técnico  
❌ Você precisa gerenciar segurança  
❌ Precisa fazer backups manuais  

**Recomendação:**
- **Iniciantes:** Google Cloud (mais fácil)
- **Intermediários:** Hostinger VPS (mais controle)

---

**Sucesso com seu deploy na Hostinger! 🚀**
