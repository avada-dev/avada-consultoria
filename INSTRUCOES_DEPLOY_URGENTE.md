# 🚨 DEPLOY URGENTE - INSTRUÇÕES SIMPLES

## ⚡ PROBLEMA CRÍTICO: CRM não cadastra usuários

**CAUSA:** Falta configurar a variável `JWT_SECRET` no Railway

---

## 📋 FAÇA ISSO AGORA (5 minutos):

### **Passo 1: Configure JWT_SECRET no Railway**

1. **Acesse:** https://railway.app/
2. **Abra** o projeto `avada-consultoria`
3. **Clique na aba** "Variables" (Variáveis)
4. **Clique em** "New Variable" ou "+ Add"
5. **Preencha:**
   - **Nome:** `JWT_SECRET`  
   - **Valor:** `avada_secret_production_2024_railway_deploy_secure`
6. **Clique em** "Add" ou "Save"
7. **Aguarde 30 segundos** - o Railway vai reiniciar automaticamente

✅ **Pronto! Agora o CRM vai funcionar!**

---

### **Passo 2: Atualizar Arquivos do Site**

#### Opção A: Upload Manual (Recomendado)

1. Vá em: https://github.com/avada-dev/avada-consultoria
2. Entre na pasta `public` → `css`
3. **Delete** o arquivo `style.css`
4. **Upload** o novo de: `C:\Users\Anderson Victor\.gemini\antigravity\scratch\avada-consultoria\public\css\style.css`
5. Volte para `public`
6. **Delete** o arquivo `sobre.html`
7. **Upload** o novo de: `C:\Users\Anderson Victor\.gemini\antigravity\scratch\avada-consultoria\public\sobre.html`

#### Opção B: Editar pelo GitHub (Mais rápido)

**Para `sobre.html`:**
1. Abra: https://github.com/avada-dev/avada-consultoria/blob/main/public/sobre.html
2. Clique no ✏️ (Edit)
3. Copie TODO o conteúdo do arquivo local
4. Cole substituindo tudo
5. "Commit changes"

**Para `style.css`:**
1. Abra: https://github.com/avada-dev/avada-consultoria/blob/main/public/css/style.css
2. Clique no ✏️ (Edit)
3. Copie TODO o conteúdo do arquivo local
4. Cole substituindo tudo
5. "Commit changes"

---

## ✅ Mudanças Implementadas

### Design Otimizado:
- ✅ Ícones reduzidos de 4rem → 2.5rem (mais delicados)
- ✅ Hero reduzido de 85vh → 70vh (sem espaço X amarelo)
- ✅ Números das estatísticas: 3rem → 2.5rem
- ✅ Altura dos cards de equipe: 300px → 200px
- ✅ Design minimalista e profissional

### Equipe:
- ✅ Dr. Joadno DENTRO do grid (centralizado com os outros)
- ✅ Layout harmonizado

### CRM:
- ✅ Depois de configurar JWT_SECRET, o cadastro vai funcionar!

---

## 🎯 Teste Final

1. Configure JWT_SECRET
2. Faça upload dos arquivos
3. Aguarde 3 minutos
4. Acesse: https://avada-consultoria-production.up.railway.app/
5. Teste cadastrar usuário no CRM

**TUDO VAI FUNCIONAR!** ✅
