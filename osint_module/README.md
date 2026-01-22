# AVADA OSINT Servidor

Plataforma de busca avançada para consultar matrículas de servidores públicos em fontes brasileiras com precisão cirúrgica, cache inteligente e monitoramento proativo.

## 🎯 Características Principais

### Busca Estrita e Contextualizada
- **Construção inteligente de query booleana** com múltiplas variações de matrícula
- **Contexto geográfico obrigatório** (Cidade + Estado) para precisão máxima
- **Sanitização rigorosa** de entrada para prevenir injeção de comandos
- **Validação regex** para matrículas (apenas alfanuméricos e separadores)

### Variações de Matrícula Suportadas
O sistema busca automaticamente por todas estas variações:
- `"Matrícula 12345"`
- `"Matrícula nº 12345"`
- `"Matrícula n° 12345"` (com símbolo de grau)
- `"Matrícula n. 12345"`
- `"Mat. 12345"`

### Performance e Otimização
- **Cache Redis** com TTL de 24 horas (reduz custos de API em até 70%)
- **Hash SHA256** para geração de chaves de cache únicas
- **Retry automático** com backoff exponencial para timeouts
- **Persistência em S3** de todos os resultados para auditoria

### Integração com SerpApi
- Configuração paramétrica específica para Brasil (`google.com.br`, `gl=br`, `hl=pt-br`)
- Busca exata com operadores booleanos rigorosos
- Tratamento de erros específicos (401/403, 429, timeouts)
- Limite de 20 resultados por busca (otimizado para precisão)

### Notificações e Monitoramento
- **Alertas automáticos** quando resultados críticos são encontrados (>10 resultados)
- **Monitoramento de erros recorrentes** com notificação ao proprietário
- **Estatísticas em tempo real** de uso e performance
- **Histórico completo** de todas as buscas realizadas

### Interface Responsiva
- Formulário de busca intuitivo com validação em tempo real
- Visualização de resultados com destaque de termos encontrados
- Página de histórico com filtros e análise de padrões
- Dashboard de estatísticas para administradores

## 📋 Requisitos

- Node.js 22.x
- MySQL/TiDB para banco de dados
- Redis (opcional, para cache)
- Chave de API SerpApi (obrigatória)

## 🚀 Instalação e Configuração

### 1. Variáveis de Ambiente Obrigatórias

```bash
# Chave de API SerpApi (obrigatória)
SERPAPI_KEY=sua_chave_aqui
```

### 2. Variáveis de Ambiente Opcionais

```bash
# Redis para cache (se não configurado, sistema funciona sem cache)
REDIS_URL=redis://usuario:senha@host:porta

# Outras variáveis já são pré-configuradas pelo Manus
```

### 3. Iniciar o Servidor

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar produção
pnpm start
```

## 📊 Estrutura de Dados

### Tabela: search_history
Armazena o histórico completo de todas as buscas realizadas:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| userId | INT | ID do usuário que realizou a busca |
| matricula | VARCHAR(100) | Matrícula buscada |
| cidade | VARCHAR(255) | Cidade de lotação |
| estado | VARCHAR(2) | UF (sigla) |
| orgao | TEXT | Órgão (opcional) |
| cargo | TEXT | Cargo (opcional) |
| queryString | TEXT | Query construída para Google |
| resultCount | INT | Número de resultados encontrados |
| fromCache | INT | 1 se veio do cache, 0 se foi busca nova |
| responseTime | INT | Tempo de resposta em ms |
| resultsUrl | TEXT | URL do arquivo JSON no S3 |
| status | ENUM | success, error, empty |
| errorMessage | TEXT | Mensagem de erro (se houver) |
| createdAt | TIMESTAMP | Data/hora da busca |

## 🔌 API tRPC

### Procedimentos Disponíveis

#### `osint.search` (Protegido)
Realiza uma busca OSINT com sanitização, cache e persistência.

**Entrada:**
```typescript
{
  matricula: string;      // Obrigatório
  cidade: string;         // Obrigatório
  estado: string;         // Obrigatório (2 letras)
  orgao?: string;         // Opcional
  cargo?: string;         // Opcional
}
```

**Saída:**
```typescript
{
  success: boolean;
  fromCache: boolean;
  results: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
  }>;
  queryString: string;
  responseTime: number;
  resultCount: number;
}
```

#### `osint.getHistory` (Protegido)
Retorna o histórico de buscas do usuário autenticado.

**Entrada:**
```typescript
{
  limit?: number;  // Default: 50, Max: 100
}
```

#### `osint.getAllHistory` (Admin)
Retorna histórico completo de todas as buscas (apenas para administradores).

**Entrada:**
```typescript
{
  limit?: number;  // Default: 100, Max: 200
}
```

#### `osint.getStatistics` (Admin)
Retorna estatísticas de uso da plataforma.

**Saída:**
```typescript
{
  totalSearches: number;
  successfulSearches: number;
  errorSearches: number;
  emptySearches: number;
  cacheHitRate: number;      // Percentual
  avgResponseTime: number;   // Em ms
}
```

## 🔐 Segurança

### Proteção de Credenciais
- Chave SerpApi nunca é exposta no frontend
- Todas as requisições passam por proxy Node.js
- Variáveis de ambiente carregadas via `process.env`

### Validação de Entrada
- Sanitização de caracteres perigosos (`<`, `>`, `(`, `)`)
- Regex restritivo para matrícula
- Validação de comprimento de campos

### CORS
- Apenas requisições do domínio autorizado são aceitas
- Bloqueio de requisições cross-origin maliciosas

## 📈 Monitoramento e Alertas

### Notificações Automáticas
O sistema notifica o proprietário em caso de:

1. **Resultados Críticos** (>10 resultados encontrados)
   - Indica potencial interesse investigativo
   - Permite análise proativa

2. **Erros Recorrentes** (5+ erros em 1 hora)
   - Problema com credenciais SerpApi
   - Limite de créditos excedido
   - Conectividade com API

3. **Cache Hit Rate Baixo** (<30%)
   - Possível problema com Redis
   - Buscas muito variadas

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Testes incluem:
# - Construção de query booleana
# - Validação de parâmetros
# - Sanitização de entrada
# - Autenticação e logout
```

## 📝 Fluxo de Busca Completo

```
1. Usuário preenche formulário
   ↓
2. Frontend valida entrada (regex, campos obrigatórios)
   ↓
3. Requisição enviada para backend tRPC
   ↓
4. Backend sanitiza entrada
   ↓
5. Backend valida parâmetros
   ↓
6. Backend constrói query booleana com variações
   ↓
7. Backend verifica cache Redis
   ├─ HIT: Retorna resultados do cache
   └─ MISS: Continua...
   ↓
8. Backend executa busca na SerpApi com retry automático
   ↓
9. Backend persiste resultados no S3
   ↓
10. Backend armazena no cache Redis (TTL 24h)
   ↓
11. Backend registra no histórico (banco de dados)
   ↓
12. Backend envia notificação se resultados críticos
   ↓
13. Frontend exibe resultados com destaque de termos
```

## 🎨 Interface

### Páginas Disponíveis

1. **Página Principal** (`/`)
   - Formulário de busca
   - Visualização de resultados
   - Informações sobre como funciona

2. **Histórico** (`/history`)
   - Lista de buscas realizadas
   - Filtros por status e data
   - Links para resultados em S3

3. **Estatísticas** (`/statistics`) - Admin
   - Métricas de uso
   - Taxa de cache hit
   - Tempo médio de resposta
   - Recomendações de otimização

## 🔧 Troubleshooting

### Erro: "SERPAPI_KEY não configurada"
- Verifique se a chave foi fornecida nas variáveis de ambiente
- Teste a chave em https://serpapi.com/dashboard

### Erro: "Limite de buscas excedido (429)"
- Seus créditos SerpApi acabaram
- Aumente o plano na conta SerpApi
- Verifique a taxa de cache hit

### Latência Elevada (>5s)
- Verifique conectividade com SerpApi
- Verifique se Redis está configurado (melhora performance)
- Considere aumentar o timeout

### Cache não funcionando
- Redis não está configurado (opcional)
- Verifique REDIS_URL se configurado
- Sistema funcionará normalmente sem cache

## 📚 Referências

- [SerpApi Documentation](https://serpapi.com/docs)
- [Google Search Operators](https://support.google.com/websearch/answer/2466433)
- [Redis Documentation](https://redis.io/documentation)
- [tRPC Documentation](https://trpc.io/docs)

## 📄 Licença

MIT

## 👨‍💻 Desenvolvimento

Este projeto foi desenvolvido seguindo o blueprint arquitetônico AVADA OSINT Servidor, implementando:

- Busca estrita com operadores booleanos
- Contexto geográfico obrigatório
- Cache inteligente com Redis
- Persistência em S3
- Notificações automáticas
- Monitoramento de performance
- Testes automatizados
- Interface responsiva

Para mais informações sobre a arquitetura, consulte o documento de blueprint fornecido.
