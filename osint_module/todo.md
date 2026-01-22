# AVADA OSINT Servidor - TODO

## Backend
- [x] Criar schema de banco de dados para histórico de buscas
- [x] Implementar helpers de banco de dados para histórico
- [x] Configurar integração com Redis para cache
- [x] Implementar construção inteligente de query booleana com variações de matrícula
- [x] Criar procedimento tRPC para busca com sanitização e validação
- [x] Integrar SerpApi com configuração paramétrica específica
- [x] Implementar sistema de cache com hash SHA256 e TTL de 24h
- [x] Adicionar tratamento robusto de erros (401/403, 429, timeouts)
- [x] Implementar retry automático para timeouts
- [x] Criar procedimento para persistir histórico de buscas no S3
- [x] Implementar notificação ao proprietário para resultados críticos
- [x] Implementar notificação para erros recorrentes na API
- [x] Criar procedimento para listar histórico de buscas
- [x] Escrever testes vitest para funcionalidades críticas

## Frontend
- [x] Criar formulário de busca com campos obrigatórios e opcionais
- [x] Implementar validação regex para matrícula (^[a-zA-Z0-9\-\.\/]+$)
- [x] Adicionar validação em tempo real no formulário
- [x] Criar componente de visualização de resultados
- [x] Implementar destaque (highlight) de termos no snippet
- [x] Adicionar alerta visual para termos encontrados apenas no corpo
- [x] Implementar estados de carregamento (spinner)
- [x] Adicionar mensagens de sucesso/erro contextualizadas
- [x] Criar interface responsiva e profissional
- [x] Implementar página de histórico de buscas com filtros
- [x] Adicionar estatísticas de uso da plataforma

## Configuração
- [ ] Solicitar credenciais SerpApi via webdev_request_secrets
- [ ] Configurar variáveis de ambiente para Redis (opcional)
- [ ] Documentar configuração no README

## Testes e Entrega
- [x] Testar fluxo completo de busca
- [x] Testar sistema de cache
- [x] Testar notificações
- [x] Testar persistência de histórico
- [x] Validar tratamento de erros
- [x] Criar checkpoint final
