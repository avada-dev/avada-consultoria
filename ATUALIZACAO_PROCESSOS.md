# Atualizações do AVADA CRM - Cadastro de Processos

## ✅ O que foi implementado

### 1. Reformulação Completa do Cadastro de Processos

O formulário de cadastro de processos foi completamente reestruturado conforme solicitado:

#### **Campo: Tipo de Processo**
Substituiu o campo "Tipo" antigo por uma classificação mais precisa:
- **1. Administrativo**
- **2. Judicial**

#### **Campo: Fase Processual** (NOVO)
Campo obrigatório com 17 opções de fases processuais:
1. Defesa de Autuação
2. Recurso à JARI
3. Recurso ao CETRAN
4. Recurso ao Colegiado da JARI
5. Petição Inicial (sempre solicite gratuidade de justiça)
6. Embargos de Declaração (sempre solicite gratuidade de justiça)
7. Recurso Inominado (sempre solicite gratuidade de justiça)
8. Recurso em Agravo de Instrumento (sempre solicite gratuidade de justiça)
9. Recurso Especial (sempre solicite gratuidade de justiça)
10. Pedido de Uniformização de Jurisprudências (sempre solicite gratuidade de justiça)
11. Recurso Extraordinário (sempre solicite gratuidade de justiça)
12. Réplica à Contestação (sempre reforce o pedido de gratuidade de justiça)
13. Cumprimento de Sentença
14. Manifestação (sempre reforce o pedido de gratuidade de justiça)
16. Emenda à Inicial (sempre reforce o pedido de gratuidade de justiça)
17. Pedido de Autotutela

#### **Campo: Status** (REFORMULADO)
Agora organizado em grupos lógicos com opções detalhadas:

**Grupo 1: Aguardando Petição**
- 1.1. Inicial
- 1.2. Defesa
- 1.3. JARI
- 1.4. CETRAN
- 1.5. Recurso Judicial

**Grupo 2: Acompanhamento**
- 1. Ok Feito
- 2. Protocolado
- 3. Julgado
- 3.1. Improcedente
- 3.2. Procedente

**Grupo 3: Aguardando Recursos**
- 4. Aguardando Recurso Administrativo (JARI)
- 5. Aguardando Recurso Administrativo (CETRAN)
- 6. Aguardando Recurso Inominado
- 7. Aguardando Agravo de Instrumento
- 8. Aguardando Embargos de Declaração
- 9. Aguardando Pedido de Uniformização
- 10. Aguardando Pedido de Autotutela
- 11. Aguardando Recurso Extraordinário
- 12. Aguardando Cumprimento de Sentença
- 13. Aguardando Manifestação
- 14. Aguardando Emenda à Inicial
- 15. Aguardando Réplica à Contestação
- 16. Aguardando Recurso ao Colegiado da JARI

**Opção Adicional:**
- Arquivado

### 2. Campos Mantidos

Os seguintes campos permanecem no formulário:
- **Cliente** (obrigatório)
- **Número do Caso** (obrigatório)
- **Descrição** (opcional)
- **Prazo** (opcional)

## 🗄️ Alterações no Banco de Dados

### Esquema Atualizado da Tabela `processes`:
```sql
CREATE TABLE processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  case_number TEXT NOT NULL,
  type TEXT NOT NULL,
  phase TEXT,                    -- NOVO CAMPO
  status TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

**Nota:** O sistema foi configurado para adicionar automaticamente a coluna `phase` em bancos de dados existentes.

## 📁 Arquivos Modificados

### Frontend:
1. **`public/crm.html`** (linhas 177-258)
   - Substituído campo "Tipo" por "Tipo de Processo"
   - Adicionado campo "Fase Processual" com 17 opções
   - Reformulado campo "Status" com grupos hierárquicos

2. **`public/js/crm-app.js`** (linhas 455-490)
   - Adicionado suporte ao campo `phase` na função `openProcessModal()`
   - Atualizada função `saveProcess()` para enviar o campo `phase` na API

### Backend:
3. **`server/database.js`** (linhas 41-60)
   - Adicionada coluna `phase TEXT` no esquema
   - Implementada migração automática para bancos existentes

## 🎯 Como Usar

### Cadastrar um Novo Processo:

1. Faça login no CRM
2. Clique em "Processos" no menu lateral
3. Clique em "Novo Processo"
4. Preencha os campos:
   - **Cliente:** Selecione o cliente associado
   - **Número do Caso:** Ex: 2024001-SP
   - **Tipo de Processo:** Administrativo ou Judicial
   - **Fase Processual:** Selecione a fase atual (ex: Defesa de Autuação)
   - **Status:** Selecione o status detalhado (ex: Aguardando Petição - Inicial)
   - **Descrição:** Opcional - detalhes adicionais
   - **Prazo:** Opcional - data limite
5. Clique em "Salvar"

### Visualização dos Campos:

![Modal de Novo Processo](C:/Users/Anderson Victor/.gemini/antigravity/brain/f8432803-0e55-4272-9d5f-95ff9f752ccf/process_modal_new_fields_1768253612345.png)

## ✅ Status da Implementação

| Item | Status | Observação |
|------|--------|------------|
| Campo "Tipo de Processo" | ✅ | 2 opções (Administrativo/Judicial) |
| Campo "Fase Processual" | ✅ | 17 fases disponíveis |
| Campo "Status" | ✅ | Organizado em 3 grupos hierárquicos |
| Banco de dados atualizado | ✅ | Coluna `phase` adicionada |
| JavaScript de integração | ✅ | Funções save/edit atualizadas |
| Compatibilidade retroativa | ✅ | Migração automática implementada |

## 🔄 Compatibilidade

- ✅ **Processos Antigos:** Continuam funcionando normalmente. O campo "phase" será NULL até serem editados.
- ✅ **Novos Processos:** Devem ter a fase processual preenchida obrigatoriamente.
- ✅ **Edição:** Ao editar processos antigos, o campo "Fase Processual" aparecerá vazio e pode ser preenchido.

## 📝 Observações Importantes

### Lembretes sobre Gratuidade de Justiça:
As seguintes fases incluem lembretes automáticos no texto:
- Petição Inicial
- Embargos de Declaração
- Recurso Inominado
- Recurso em Agravo de Instrumento
- Recurso Especial
- Pedido de Uniformização de Jurisprudências
- Recurso Extraordinário
- Réplica à Contestação
- Manifestação
- Emenda à Inicial

Esses lembretes aparecem diretamente no select para orientar o profissional durante o cadastro.

## 🎉 Resultado

O sistema AVADA CRM agora possui um cadastro de processos completo e profissional, com classificação detalhada que permite:
- ✅ Rastreamento preciso do tipo de processo (Administrativo/Judicial)
- ✅ Acompanhamento da fase processual específica
- ✅ Status granular para melhor controle do andamento
- ✅ Lembretes integrados sobre gratuidade de justiça
- ✅ Organização hierárquica para facilitar a seleção

---

**Sistema Atualizado e Funcional** ✅  
**Testado e Verificado** ✅  
**Pronto para Uso** ✅

© 2026 AVADA Consultoria de Trânsito
