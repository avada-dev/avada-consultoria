# 🎯 Guia Completo para Leigos: Deploy no Google Cloud

## 📚 Índice
1. [O que você vai fazer](#o-que-você-vai-fazer)
2. [Ferramentas necessárias](#ferramentas-necessárias)
3. [Passo 1: Preparar seu computador](#passo-1-preparar-seu-computador)
4. [Passo 2: Preparar o código](#passo-2-preparar-o-código)
5. [Passo 3: Criar projeto no Google Cloud](#passo-3-criar-projeto-no-google-cloud)
6. [Passo 4: Fazer o Deploy](#passo-4-fazer-o-deploy)
7. [Passo 5: Acessar sua aplicação](#passo-5-acessar-sua-aplicação)
8. [Resolução de Problemas](#resolução-de-problemas)

---

## O que você vai fazer

Você vai colocar seu site AVADA Consultoria "na nuvem" do Google, para que qualquer pessoa possa acessar pela internet. É como colocar seu site "no ar".

**Resultado final:** Você terá uma URL tipo `https://avada-consultoria-xxxxx.a.run.app` que qualquer pessoa pode acessar.

**Tempo estimado:** 30-45 minutos (na primeira vez)

---

## Ferramentas necessárias

Você vai precisar instalar 2 programas no seu computador:

1. **Git** - Para gerenciar o código
2. **Google Cloud SDK** - Para conversar com o Google Cloud

**Não se preocupe, vou explicar como instalar tudo!**

---

## Passo 1: Preparar seu computador

### 1.1 Instalar Git

**O que é Git?** É um programa que ajuda a gerenciar código. Você precisa dele para enviar seu site para o Google.

**Como instalar:**

1. Abra seu navegador e vá em: https://git-scm.com/download/win
2. Clique no link de download (vai baixar automaticamente)
3. Quando terminar de baixar, abra o arquivo
4. Clique em "Next" em todas as telas (deixe as opções padrão)
5. Clique em "Install"
6. Quando terminar, clique em "Finish"

**Como verificar se funcionou:**

1. Pressione as teclas `Win + R` no seu teclado
2. Digite: `cmd` e pressione Enter
3. Uma janela preta vai abrir
4. Digite: `git --version` e pressione Enter
5. Deve aparecer algo como: `git version 2.43.0`

✅ Se aparecer a versão, está instalado!

### 1.2 Instalar Google Cloud SDK

**O que é?** É o programa que permite você enviar arquivos para o Google Cloud.

**Como instalar:**

1. Vá em: https://cloud.google.com/sdk/docs/install
2. Clique em "Windows" (se estiver usando Windows)
3. Baixe o instalador (GoogleCloudSDKInstaller.exe)
4. Execute o arquivo baixado
5. Marque as opções:
   - ✅ "Install bundled Python"
   - ✅ "Run gcloud init"
6. Clique em "Install"
7. Aguarde a instalação (pode demorar 5-10 minutos)
8. Uma nova janela vai abrir pedindo login - **deixe aberta por enquanto**

✅ Instalação completa!

---

## Passo 2: Preparar o código

### 2.1 Abrir a pasta do projeto

1. Abra o "Explorador de Arquivos" do Windows
2. Navegue até: `C:\Users\Anderson Victor\.gemini\antigravity\scratch\avada-consultoria`
3. Esta é a pasta do seu projeto

### 2.2 Abrir o Prompt de Comando nesta pasta

**Jeito fácil:**

1. Dentro da pasta do projeto (do passo anterior)
2. Clique na barra de endereço (onde está escrito o caminho)
3. Digite: `cmd` e pressione Enter
4. Uma janela preta vai abrir já na pasta certa

**Jeito alternativo:**

1. Pressione `Win + R`
2. Digite: `cmd` e pressione Enter
3. Digite: `cd "C:\Users\Anderson Victor\.gemini\antigravity\scratch\avada-consultoria"`
4. Pressione Enter

✅ Agora você está na pasta do projeto!

### 2.3 Inicializar Git (apenas primeira vez)

**O que isso faz?** Prepara seu projeto para ser enviado ao Google.

**Digite esses comandos um por um:**

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
git init
git add .
git commit -m "Meu projeto AVADA pronto para deploy"
```

**Explicação:**
- Linha 1: Define seu nome (substitua "Seu Nome")
- Linha 2: Define seu email (substitua "seu@email.com")
- Linha 3: Inicia o Git nesta pasta
- Linha 4: Adiciona todos os arquivos
- Linha 5: Salva os arquivos

✅ Código preparado!

---

## Passo 3: Criar projeto no Google Cloud

### 3.1 Fazer login no Google Cloud

1. No prompt de comando, digite:
   ```bash
   gcloud auth login
   ```
2. Pressione Enter
3. Seu navegador vai abrir automaticamente
4. Escolha sua conta Google (a paga)
5. Clique em "Permitir"
6. Volte para o prompt de comando

✅ Login feito!

### 3.2 Criar um novo projeto

**O que é um projeto?** É como uma "pasta" no Google Cloud onde seu site vai ficar.

1. Digite este comando:
   ```bash
   gcloud projects create avada-consultoria-2024 --name="AVADA Consultoria"
   ```

2. Pressione Enter

3. Aguarde alguns segundos

4. Deve aparecer: "Created [...]"

**Se der erro dizendo que o nome já existe:**
- Use outro nome, por exemplo: `avada-consultoria-2024-prod`
- O importante é que seja único

✅ Projeto criado!

### 3.3 Ativar o projeto

1. Digite:
   ```bash
   gcloud config set project avada-consultoria-2024
   ```

2. Pressione Enter

✅ Projeto ativado!

### 3.4 Vincular cartão de crédito (obrigatório)

**Por que?** O Google precisa de um cartão mesmo que você use créditos grátis.

1. Abra: https://console.cloud.google.com/billing
2. Faça login com sua conta
3. Clique em "ADICIONAR CONTA DE FATURAMENTO" (se aparecer)
4. Siga as instruções para adicionar seu cartão
5. Volte para: https://console.cloud.google.com/
6. No topo, selecione seu projeto "AVADA Consultoria"

✅ Faturamento configurado!

### 3.5 Ativar APIs necessárias

**O que são APIs?** São "permissões" que o Google precisa para rodar seu site.

Digite esses 2 comandos:

```bash
gcloud services enable run.googleapis.com
```
_(Pressione Enter e aguarde)_

```bash
gcloud services enable cloudbuild.googleapis.com
```
_(Pressione Enter e aguarde)_

Cada um pode demorar 30-60 segundos. Aguarde até aparecer "Enabled".

✅ APIs ativadas!

---

## Passo 4: Fazer o Deploy

### 4.1 Definir chave secreta JWT

**O que é isso?** É uma "senha" que protege seu sistema CRM.

1. Digite este comando para gerar uma chave forte:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Vai aparecer algo como: `a1b2c3d4e5f6...` (uma sequência aleatória)

3. **COPIE** esse texto (selecione e Ctrl+C)

4. **GUARDE** em um bloco de notas para usar depois

✅ Chave criada!

### 4.2 Fazer o Deploy no Cloud Run

**Este é o momento principal!** 

1. Digite este comando (TUDO em uma linha):
   ```bash
   gcloud run deploy avada-consultoria --source . --region southamerica-east1 --allow-unauthenticated --set-env-vars="JWT_SECRET=COLE_SUA_CHAVE_AQUI,NODE_ENV=production"
   ```

2. **IMPORTANTE:** Substitua `COLE_SUA_CHAVE_AQUI` pela chave que você copiou no passo 4.1

**Exemplo completo:**
```bash
gcloud run deploy avada-consultoria --source . --region southamerica-east1 --allow-unauthenticated --set-env-vars="JWT_SECRET=a1b2c3d4e5f6...,NODE_ENV=production"
```

3. Pressione Enter

4. **Aguarde!** Isso vai demorar 3-5 minutos

**O que vai acontecer:**
- ⏳ "Building..." - Criando seu site
- ⏳ "Deploying..." - Enviando para o Google
- ✅ "Service URL: https://..." - Pronto!

5. Quando terminar, vai aparecer uma URL como:
   ```
   Service URL: https://avada-consultoria-xxxxx-rj.a.run.app
   ```

6. **COPIE ESSA URL!** É o endereço do seu site!

✅ Deploy completo!

---

## Passo 5: Acessar sua aplicação

### 5.1 Testar o Website

1. Abra seu navegador
2. Cole a URL que você copiou
3. Deve abrir o site da AVADA Consultoria!

**Páginas para testar:**
- Home: `https://sua-url.app/`
- Serviços: `https://sua-url.app/servicos.html`
- Sobre: `https://sua-url.app/sobre.html`
- Contato: `https://sua-url.app/contato.html`

### 5.2 Testar o CRM

1. Vá em: `https://sua-url.app/crm.html`
2. Faça login com:
   - **Email:** victorvitrine02@gmail.com
   - **Senha:** avada2024
3. Deve abrir o painel CRM!

✅ **PARABÉNS! SEU SITE ESTÁ NO AR!** 🎉

---

## Como ver detalhes no painel do Google

Você pode acompanhar tudo pelo painel visual:

1. Acesse: https://console.cloud.google.com/run
2. Faça login
3. Você verá seu serviço "avada-consultoria"
4. Clique nele para ver:
   - Número de acessos
   - Logs (registros do que está acontecendo)
   - Métricas de uso

---

## Resolução de Problemas

### ❌ Erro: "gcloud: command not found"

**Solução:**
1. Feche o prompt de comando
2. Abra novamente
3. Tente o comando de novo

Se não funcionar:
1. Reinstale o Google Cloud SDK
2. Certifique-se de marcar "Add to PATH"

### ❌ Erro: "Permission denied"

**Solução:**
```bash
gcloud auth login
```
Faça login novamente.

### ❌ Erro: "Billing account required"

**Solução:**
1. Acesse: https://console.cloud.google.com/billing
2. Vincule um cartão de crédito
3. Tente o deploy novamente

### ❌ Site não abre no navegador

**Soluções:**
1. Aguarde 2-3 minutos (às vezes demora para propagar)
2. Verifique se a URL está correta (cole exatamente como apareceu)
3. Tente em uma aba anônima do navegador
4. Confira se o deploy terminou com sucesso

### ❌ CRM dá erro ao fazer login

**Soluções:**
1. Verifique se você configurou o JWT_SECRET
2. Veja os logs:
   ```bash
   gcloud run services logs read avada-consultoria --region southamerica-east1
   ```

---

## Como atualizar o site depois

Se você fizer mudanças no código e quiser atualizar o site:

1. Abra o prompt na pasta do projeto
2. Digite:
   ```bash
   git add .
   git commit -m "Atualizações no site"
   gcloud run deploy avada-consultoria --source . --region southamerica-east1
   ```
3. Aguarde 3-5 minutos
4. Pronto! Site atualizado!

---

## Custos

**Você já tem conta paga, então:**

- **Primeiros $300:** Grátis (crédito Google Cloud)
- **Cloud Run:** Grátis até 2 milhões de acessos/mês
- **Estimativa realista:** R$ 0-30/mês depois dos créditos

O Google vai te avisar por email antes de cobrar qualquer coisa.

---

## Suporte

Se tiver dúvidas:

1. **Ver logs em tempo real:**
   ```bash
   gcloud run services logs tail avada-consultoria --region southamerica-east1
   ```

2. **Painel visual:** https://console.cloud.google.com/run

3. **Email de suporte:** Você pode abrir tickets no Google Cloud Console

---

## Checklist Final

Use isso para verificar se fez tudo:

- [ ] Git instalado e funcionando
- [ ] Google Cloud SDK instalado
- [ ] Login feito no Google Cloud
- [ ] Projeto criado
- [ ] Cartão vinculado ao projeto
- [ ] APIs ativadas
- [ ] JWT_SECRET gerado e salvo
- [ ] Deploy realizado com sucesso
- [ ] URL do site recebida
- [ ] Website abrindo no navegador
- [ ] CRM abrindo e login funcionando

---

## 🎉 Parabéns!

Você acabou de fazer seu primeiro deploy na nuvem! Seu site agora está:

✅ **Acessível** para qualquer pessoa na internet  
✅ **Seguro** com login protegido  
✅ **Escalável** - aguenta muitos acessos  
✅ **Profissional** - rodando na infraestrutura do Google  

**Sua URL:** `https://avada-consultoria-xxxxx-rj.a.run.app`

**Compartilhe com seus clientes!** 🚀

---

**Precisa de mais ajuda?** Releia este guia - cada passo está explicado em detalhes!
