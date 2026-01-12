# Deploy no Google Cloud Platform (GCP)

## 🌐 Visão Geral

O Google Cloud oferece várias opções para hospedar sua aplicação Node.js. Este guia cobre as 3 principais:

1. **Cloud Run** (Recomendado) - Containers serverless, fácil e escalável
2. **App Engine** - Plataforma gerenciada tradicional
3. **Compute Engine** - VMs completas com controle total

## ⚠️ Importante: SQLite no Google Cloud

**SQLite não é recomendado em produção** em ambientes serverless (Cloud Run, App Engine) porque:
- O arquivo de banco pode ser perdido em restarts
- Não há persistência garantida entre instâncias

**Soluções:**
- **Curto prazo:** Use Cloud Run + Volume persistente
- **Recomendado:** Migre para Cloud SQL (PostgreSQL/MySQL)

---

## 🚀 Opção 1: Cloud Run (RECOMENDADO)

Cloud Run executa containers Docker de forma serverless. Escala automaticamente de 0 a infinito.

### Pré-requisitos:
- Conta Google Cloud (crédito grátis de $300)
- Google Cloud SDK instalado

### Passo 1: Instalar Google Cloud SDK

**Windows:**
```powershell
# Baixe e instale: https://cloud.google.com/sdk/docs/install
```

**Verificar instalação:**
```bash
gcloud --version
```

### Passo 2: Criar Dockerfile

Já vou criar o Dockerfile para você (veja arquivo `Dockerfile` criado).

### Passo 3: Criar arquivo `.dockerignore`

Já vou criar o `.dockerignore` para você (veja arquivo criado).

### Passo 4: Configurar Google Cloud

```bash
# Login
gcloud auth login

# Criar projeto (substitua pelo seu nome)
gcloud projects create avada-consultoria-prod --name="AVADA Consultoria"

# Definir projeto ativo
gcloud config set project avada-consultoria-prod

# Habilitar APIs necessárias
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Passo 5: Build e Deploy

```bash
# Build da imagem
gcloud builds submit --tag gcr.io/avada-consultoria-prod/avada-app

# Deploy no Cloud Run
gcloud run deploy avada-consultoria \
  --image gcr.io/avada-consultoria-prod/avada-app \
  --platform managed \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars="JWT_SECRET=sua_chave_secreta_aqui,NODE_ENV=production"
```

### Passo 6: Configurar Variáveis de Ambiente

```bash
gcloud run services update avada-consultoria \
  --update-env-vars JWT_SECRET=avada_super_secret_2024_production,NODE_ENV=production \
  --region southamerica-east1
```

### Passo 7: Obter URL

```bash
gcloud run services describe avada-consultoria --region southamerica-east1 --format='value(status.url)'
```

Sua aplicação estará em: `https://avada-consultoria-xxxxx-rj.a.run.app`

---

## 🚀 Opção 2: App Engine

App Engine é uma plataforma tradicional gerenciada pelo Google.

### Passo 1: Criar `app.yaml`

Já vou criar o arquivo para você (veja `app.yaml` criado).

### Passo 2: Deploy

```bash
# Login e configurar projeto
gcloud auth login
gcloud config set project avada-consultoria-prod

# Habilitar App Engine
gcloud app create --region=southamerica-east1

# Deploy
gcloud app deploy

# Abrir no navegador
gcloud app browse
```

### Configurar Variáveis de Ambiente:

```bash
# Edite app.yaml e adicione:
env_variables:
  JWT_SECRET: 'sua_chave_secreta_aqui'
  NODE_ENV: 'production'
```

---

## 🚀 Opção 3: Compute Engine (Controle Total)

Para controle total, use uma VM.

### Passo 1: Criar VM

```bash
gcloud compute instances create avada-vm \
  --zone=southamerica-east1-a \
  --machine-type=e2-micro \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=10GB
```

### Passo 2: SSH na VM

```bash
gcloud compute ssh avada-vm --zone=southamerica-east1-a
```

### Passo 3: Instalar Node.js

```bash
# Na VM:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y git
```

### Passo 4: Clonar e Configurar

```bash
# Clonar repositório
git clone https://github.com/SEU_USUARIO/avada-consultoria.git
cd avada-consultoria

# Instalar dependências
npm install

# Criar .env
nano .env
# Adicione:
# JWT_SECRET=sua_chave_secreta
# NODE_ENV=production
# PORT=3000

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Iniciar aplicação
pm2 start server/server.js --name avada
pm2 startup
pm2 save
```

### Passo 5: Configurar Firewall

```bash
# Permitir tráfego HTTP
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server

# Adicionar tag à VM
gcloud compute instances add-tags avada-vm \
  --tags http-server \
  --zone southamerica-east1-a
```

### Passo 6: Configurar Nginx (Proxy Reverso)

```bash
# Instalar Nginx
sudo apt-get install -y nginx

# Configurar
sudo nano /etc/nginx/sites-available/avada

# Adicione:
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar configuração
sudo ln -s /etc/nginx/sites-available/avada /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 💾 Migrar de SQLite para Cloud SQL (PostgreSQL)

### Passo 1: Criar instância Cloud SQL

```bash
gcloud sql instances create avada-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=southamerica-east1
```

### Passo 2: Criar banco e usuário

```bash
gcloud sql databases create avada_production --instance=avada-db

gcloud sql users create avada_user \
  --instance=avada-db \
  --password=senha_forte_aqui
```

### Passo 3: Obter string de conexão

```bash
gcloud sql instances describe avada-db --format='value(connectionName)'
```

### Passo 4: Atualizar código

Instale driver PostgreSQL:
```bash
npm install pg
```

Atualize `server/database.js` para usar PostgreSQL (fornecerei código se necessário).

### Passo 5: Configurar variável de ambiente

```bash
# Para Cloud Run:
gcloud run services update avada-consultoria \
  --add-cloudsql-instances=avada-consultoria-prod:southamerica-east1:avada-db \
  --update-env-vars DATABASE_URL=postgresql://avada_user:senha@/avada_production?host=/cloudsql/INSTANCE_CONNECTION_NAME
```

---

## 💰 Custos Estimados

### Cloud Run (Recomendado):
- **Grátis até:** 2 milhões de requisições/mês
- **Após:** ~$0.40 por milhão de requisições
- **Estimativa:** R$ 0-50/mês para tráfego baixo a médio

### App Engine:
- **Grátis até:** 28 horas de instância/dia
- **Após:** ~$0.05/hora
- **Estimativa:** R$ 0-100/mês

### Compute Engine:
- **e2-micro:** ~$7-10/mês (incluso no Free Tier por 1 VM)
- **Estimativa:** R$ 0-50/mês no primeiro ano

### Cloud SQL:
- **db-f1-micro:** ~$10-15/mês
- **Estimativa:** R$ 50-75/mês

---

## 🔒 Segurança

### Secrets Manager (para JWT_SECRET):

```bash
# Criar secret
echo -n "sua_chave_secreta_super_forte" | gcloud secrets create jwt-secret --data-file=-

# Permitir acesso ao Cloud Run
gcloud secrets add-iam-policy-binding jwt-secret \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Usar no Cloud Run
gcloud run deploy avada-consultoria \
  --update-secrets=JWT_SECRET=jwt-secret:latest
```

---

## 📊 Monitoramento

### Ver logs:

```bash
# Cloud Run
gcloud run services logs read avada-consultoria --region southamerica-east1

# App Engine
gcloud app logs tail

# Compute Engine
gcloud compute ssh avada-vm --command "pm2 logs"
```

### Dashboard:
- Acesse: https://console.cloud.google.com/
- Cloud Run → Métricas
- Monitore: Requisições, Latência, Erros

---

## ✅ Checklist de Deploy

- [ ] Google Cloud SDK instalado
- [ ] Projeto criado no GCP
- [ ] Docker configurado (para Cloud Run)
- [ ] Variáveis de ambiente definidas
- [ ] Deploy realizado com sucesso
- [ ] URL pública acessível
- [ ] Website funcionando
- [ ] CRM acessível
- [ ] Login testado
- [ ] (Opcional) Cloud SQL configurado
- [ ] (Opcional) Domínio customizado
- [ ] Monitoramento ativo

---

## 🎓 Comandos Úteis

```bash
# Ver todos os projetos
gcloud projects list

# Ver serviços Cloud Run
gcloud run services list

# Ver custo estimado
gcloud billing accounts list
gcloud alpha billing budgets list

# Deletar recursos
gcloud run services delete avada-consultoria
gcloud sql instances delete avada-db
```

---

## 🆘 Troubleshooting

### Erro: "Permission denied"
```bash
gcloud auth login
gcloud auth application-default login
```

### Erro: "Quota exceeded"
- Verifique limites: https://console.cloud.google.com/iam-admin/quotas
- Solicite aumento de cota

### Erro: "Build failed"
- Verifique Dockerfile
- Teste localmente: `docker build -t avada-test .`

---

## 🎯 Recomendação Final

**Para começar:** Use **Cloud Run**
- Mais fácil
- Escalável automaticamente
- Custo-benefício excelente
- Grátis até 2M requisições/mês

**Para produção séria:** Migre para **Cloud SQL** + **Cloud Run**
- Mais confiável
- Backups automáticos
- Alta disponibilidade

🚀 **Comando rápido Cloud Run:**
```bash
gcloud run deploy avada-consultoria --source . --region southamerica-east1 --allow-unauthenticated
```

Boa sorte com seu deploy no Google Cloud! ☁️
