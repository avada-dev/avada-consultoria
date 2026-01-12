# Deploy Rápido no Google Cloud

## 🚀 Cloud Run em 3 Comandos

### Pré-requisito:
Instale Google Cloud SDK: https://cloud.google.com/sdk/docs/install

### Comandos:

```bash
# 1. Login
gcloud auth login

# 2. Configurar projeto
gcloud config set project SEU_PROJETO_ID

# 3. Deploy!
gcloud run deploy avada-consultoria \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --set-env-vars="JWT_SECRET=avada_secret_2024,NODE_ENV=production"
```

### ✅ Pronto!
Sua URL será: `https://avada-consultoria-xxxxx-rj.a.run.app`

---

## 📋 Se não tiver projeto ainda:

```bash
# Criar projeto
gcloud projects create avada-prod-$(date +%s) --name="AVADA Consultoria"

# Ver projetos
gcloud projects list

# Definir projeto ativo (use o ID da lista acima)
gcloud config set project SEU_PROJETO_ID

# Habilitar billing (necessário apenas uma vez)
# Vá em: https://console.cloud.google.com/billing
```

---

## 🔄 Atualizar Aplicação

Sempre que fizer mudanças:
```bash
git add .
git commit -m "Atualização"
gcloud run deploy avada-consultoria --source . --region southamerica-east1
```

---

## 🔐 Alterar JWT_SECRET

```bash
gcloud run services update avada-consultoria \
  --update-env-vars JWT_SECRET=NOVA_CHAVE_FORTE \
  --region southamerica-east1
```

---

## 📊 Ver Logs

```bash
gcloud run services logs read avada-consultoria --region southamerica-east1 --limit=50
```

---

## 💰 Custo

**Grátis até:** 2 milhões de requisições/mês  
**Estimativa:** R$ 0-30/mês para uso moderado

---

## 🗑️ Deletar (se necessário)

```bash
gcloud run services delete avada-consultoria --region southamerica-east1
```

---

## 🎯 Domínio Personalizado

1. Vá em: https://console.cloud.google.com/run
2. Selecione seu serviço
3. "MANAGE CUSTOM DOMAINS"
4. Siga as instruções

🚀 **É isso! Seu app está na nuvem!**
