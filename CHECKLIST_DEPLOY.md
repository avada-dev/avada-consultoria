# ✅ Checklist de Deploy - AVADA Consultoria

Use este checklist para marcar cada etapa concluída. Imprima ou mantenha aberto enquanto faz o deploy!

---

## 📦 FASE 1: PREPARAÇÃO (30 min)

### Instalações
- [ ] Baixei o Git de https://git-scm.com/download/win
- [ ] Instalei o Git (cliquei Next em tudo)
- [ ] Testei digitando `git --version` no cmd
- [ ] Baixei Google Cloud SDK de https://cloud.google.com/sdk/docs/install
- [ ] Instalei Google Cloud SDK (marquei todas as opções)
- [ ] Aguardei a instalação completar (5-10 min)

### Preparar o Código  
- [ ] Abri o Explorador de Arquivos
- [ ] Fui até: `C:\Users\Anderson Victor\.gemini\antigravity\scratch\avada-consultoria`
- [ ] Cliquei na barra de endereço e digitei `cmd`
- [ ] Prompt de comando abriu na pasta certa
- [ ] Digitei: `git config --global user.name "Meu Nome"`
- [ ] Digitei: `git config --global user.email "meu@email.com"`
- [ ] Digitei: `git init`
- [ ] Digitei: `git add .`
- [ ] Digitei: `git commit -m "Deploy AVADA"`

---

## ☁️ FASE 2: GOOGLE CLOUD (15 min)

### Login
- [ ] Digitei: `gcloud auth login`
- [ ] Navegador abriu automaticamente
- [ ] Escolhi minha conta Google
- [ ] Cliquei em "Permitir"
- [ ] Voltei para o cmd

### Criar Projeto
- [ ] Digitei: `gcloud projects create avada-consultoria-2024 --name="AVADA Consultoria"`
- [ ] Aguardei aparecer "Created"
- [ ] Digitei: `gcloud config set project avada-consultoria-2024`
- [ ] **SE DEU ERRO de nome duplicado:**
  - [ ] Usei outro nome: `avada-consultoria-2024-prod`
  - [ ] Refiz o comando com novo nome

### Vincular Pagamento
- [ ] Abri: https://console.cloud.google.com/billing
- [ ] Fiz login
- [ ] Adicionei cartão de crédito (se pediu)
- [ ] Selecionei o projeto "AVADA Consultoria" no topo

### Ativar APIs
- [ ] Digitei: `gcloud services enable run.googleapis.com`
- [ ] Aguardei aparecer "Enabled" (30-60 seg)
- [ ] Digitei: `gcloud services enable cloudbuild.googleapis.com`
- [ ] Aguardei aparecer "Enabled" (30-60 seg)

---

## 🚀 FASE 3: DEPLOY (10 min)

### Gerar Chave Secreta
- [ ] Digitei: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Copiei o texto que apareceu (Ctrl+C)
- [ ] Colei no Bloco de Notas e salvei

### Deploy Final
- [ ] Preparei o comando:
  ```
  gcloud run deploy avada-consultoria --source . --region southamerica-east1 --allow-unauthenticated --set-env-vars="JWT_SECRET=MINHA_CHAVE_AQUI,NODE_ENV=production"
  ```
- [ ] Substituí `MINHA_CHAVE_AQUI` pela chave que copiei
- [ ] Colei o comando completo no cmd
- [ ] Pressionei Enter
- [ ] **AGUARDEI 3-5 MINUTOS** (não fechei a janela!)
- [ ] Apareceu "Service URL: https://..."
- [ ] **COPIEI A URL COMPLETA**
- [ ] Colei a URL no Bloco de Notas e salvei

---

## ✅ FASE 4: TESTAR (5 min)

### Testar Website
- [ ] Abri o navegador
- [ ] Colei a URL do meu site
- [ ] Site da AVADA abriu!
- [ ] Testei: Cliquei em "Serviços" - funcionou
- [ ] Testei: Cliquei em "Sobre" - funcionou
- [ ] Testei: Cliquei em "Contato" - funcionou

### Testar CRM
- [ ] Adicionei `/crm.html` no fim da URL
- [ ] Tela de login apareceu
- [ ] Digitei email: `victorvitrine02@gmail.com`
- [ ] Digitei senha: `avada2024`
- [ ] Cliquei em "Entrar"
- [ ] Dashboard do CRM abriu!
- [ ] Cliquei em "Clientes" - funcionou
- [ ] Cliquei em "Processos" - funcionou
- [ ] (Se admin) Cliquei em "Informações do Sistema" - funcionou

---

## 🎉 CONCLUSÃO

### Informações Finais para Guardar

**Minha URL do site:**
```
https://avada-consultoria-xxxxx-rj.a.run.app
```
_(Escreva sua URL aqui)_

**Credenciais de Admin:**
- Email: victorvitrine02@gmail.com
- Senha: avada2024

**Chave JWT (CONFIDENCIAL):**
```
[Cole aqui a chave que você gerou]
```

**Nome do Projeto Google Cloud:**
```
avada-consultoria-2024
```

**Data do Deploy:**
```
____/____/2024
```

---

## 📊 Painel de Controle

Para ver estatísticas e logs:
https://console.cloud.google.com/run

---

## 🔄 Como Atualizar Depois

Quando fizer mudanças no código:

1. [ ] Abrir cmd na pasta do projeto
2. [ ] Digitar: `git add .`
3. [ ] Digitar: `git commit -m "Atualização"`
4. [ ] Digitar: `gcloud run deploy avada-consultoria --source . --region southamerica-east1`
5. [ ] Aguardar 3-5 minutos
6. [ ] Pronto! Site atualizado!

---

## 🆘 Precisa de Ajuda?

**Links úteis:**
- Logs: `gcloud run services logs read avada-consultoria --region southamerica-east1`
- Painel: https://console.cloud.google.com/run
- Suporte: https://cloud.google.com/support

---

## ✅ TUDO FEITO!

- [ ] **MARQUEI TODAS AS CAIXAS ACIMA**
- [ ] **SITE ESTÁ NO AR E FUNCIONANDO**
- [ ] **SALVEI TODAS AS INFORMAÇÕES**

**PARABÉNS! 🎊 Você fez seu primeiro deploy na nuvem!**

---

**Imprima este checklist ou marque digitalmente enquanto segue o guia!**
