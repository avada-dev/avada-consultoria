# 🎯 COMANDOS EXATOS - Copie e Cole (SEM ERROS)

## ⚠️ REGRA IMPORTANTE

Quando você ver um comando com fundo cinza nos guias, copie APENAS o texto do comando, NÃO copie a palavra "bash" ou as aspas ```

---

## PASSO 1: Abrir o Prompt de Comando na Pasta Certa

1. Abra o Explorador de Arquivos
2. Vá até: C:\Users\Anderson Victor\.gemini\antigravity\scratch\avada-consultoria
3. Clique na barra de endereço (onde mostra o caminho)
4. Digite: cmd
5. Pressione Enter

Uma janela preta vai abrir. Você está pronto!

---

## PASSO 2: Configurar Git (Primeira Vez)

**COMANDO 1 - Copie e cole isso:**
```
git config --global user.name "avada"
```
Pressione Enter

**COMANDO 2 - Copie e cole isso:**
```
git config --global user.email "victorvitrine02@gmail.com"
```
Pressione Enter

✅ Nenhum dos dois comandos mostra nada na tela. Isso é NORMAL!

---

## PASSO 3: Preparar o Projeto

**COMANDO 3 - Copie e cole:**
```
git init
```
Pressione Enter

**Deve aparecer:** "Initialized empty Git repository..."

**COMANDO 4 - Copie e cole:**
```
git add .
```
Pressione Enter

**COMANDO 5 - Copie e cole:**
```
git commit -m "Deploy AVADA"
```
Pressione Enter

**Deve aparecer:** Várias linhas mostrando arquivos adicionados

---

## PASSO 4: Login no Google Cloud

**COMANDO 6 - Copie e cole:**
```
gcloud auth login
```
Pressione Enter

**O que vai acontecer:**
- Seu navegador vai abrir sozinho
- Escolha sua conta Google
- Clique em "Permitir"
- Volte para a janela preta

---

## PASSO 5: Criar Projeto

**COMANDO 7 - Copie e cole:**
```
gcloud projects create avada-consultoria-2024 --name="AVADA Consultoria"
```
Pressione Enter

**Aguarde 10-20 segundos**

**Se der erro dizendo que já existe:**
Use este comando alternativo:
```
gcloud projects create avada-prod-2024 --name="AVADA Consultoria"
```

---

## PASSO 6: Ativar o Projeto

**COMANDO 8 - Copie e cole (use o nome que funcionou acima):**
```
gcloud config set project avada-consultoria-2024
```
Pressione Enter

**OU se usou o nome alternativo:**
```
gcloud config set project avada-prod-2024
```

---

## PASSO 7: Ativar APIs

**COMANDO 9 - Copie e cole:**
```
gcloud services enable run.googleapis.com
```
Pressione Enter

**Aguarde 30-60 segundos** até aparecer "Operation finished successfully"

**COMANDO 10 - Copie e cole:**
```
gcloud services enable cloudbuild.googleapis.com
```
Pressione Enter

**Aguarde mais 30-60 segundos**

---

## PASSO 8: Gerar Chave Secreta

**COMANDO 11 - Copie e cole:**
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Pressione Enter

**Vai aparecer:** Uma sequência aleatória tipo: a1b2c3d4e5f6...

**COPIE esse texto** (selecione com mouse, clique com botão direito, escolha "Copiar")
**COLE no Bloco de Notas** e salve

---

## PASSO 9: DEPLOY FINAL!

**IMPORTANTE:** No comando abaixo, você precisa substituir COLE_SUA_CHAVE_AQUI pela chave que copiou no Passo 8

**COMANDO 12 - LEIA COM ATENÇÃO:**

MODELO (NÃO COPIE AINDA):
```
gcloud run deploy avada-consultoria --source . --region southamerica-east1 --allow-unauthenticated --set-env-vars="JWT_SECRET=COLE_SUA_CHAVE_AQUI,NODE_ENV=production"
```

**COMO FAZER:**
1. Copie o comando acima
2. Cole no Bloco de Notas
3. Substitua COLE_SUA_CHAVE_AQUI pela sua chave do Passo 8
4. Copie o comando completo modificado
5. Cole no terminal
6. Pressione Enter

**EXEMPLO de como deve ficar:**
```
gcloud run deploy avada-consultoria --source . --region southamerica-east1 --allow-unauthenticated --set-env-vars="JWT_SECRET=a1b2c3d4e5f6g7h8i9j0,NODE_ENV=production"
```

**AGUARDE 3-5 MINUTOS!** Vai aparecer muitas mensagens. Isso é normal!

---

## ✅ PRONTO!

Quando terminar, vai aparecer:
```
Service URL: https://avada-consultoria-xxxxx-rj.a.run.app
```

**COPIE ESSA URL!** É o endereço do seu site!

---

## 🆘 SE DER ERRO

### Erro: "gcloud: não reconhecido"
**Solução:**
1. Feche o cmd
2. Abra novamente
3. Tente de novo

### Erro: "git: não reconhecido"
**Solução:**
Você precisa instalar o Git primeiro:
1. Vá em: https://git-scm.com/download/win
2. Baixe e instale
3. Reinicie o cmd

### Erro: "Project already exists"
**Solução:**
Use um nome diferente no COMANDO 7, tipo:
```
gcloud projects create avada-prod-2024-novo --name="AVADA"
```

---

## 📝 RESUMO DOS COMANDOS EM ORDEM

Para copiar rápido, aqui estão TODOS os comandos:

1. `git config --global user.name "avada"`
2. `git config --global user.email "victorvitrine02@gmail.com"`
3. `git init`
4. `git add .`
5. `git commit -m "Deploy AVADA"`
6. `gcloud auth login`
7. `gcloud projects create avada-consultoria-2024 --name="AVADA Consultoria"`
8. `gcloud config set project avada-consultoria-2024`
9. `gcloud services enable run.googleapis.com`
10. `gcloud services enable cloudbuild.googleapis.com`
11. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
12. **[Comando do deploy com sua chave - veja Passo 9]**

---

**Agora sim! Sem confusão! Basta copiar e colar cada comando!** 🚀
