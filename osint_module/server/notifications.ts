import { notifyOwner } from "./_core/notification";

/**
 * Notificar proprietário sobre resultados críticos de busca
 * Considera crítico quando há mais de 10 resultados encontrados
 */
export async function notifyCriticalResults(params: {
  matricula: string;
  cidade: string;
  estado: string;
  resultCount: number;
  userName: string;
}): Promise<boolean> {
  try {
    const title = `🔍 Busca OSINT: ${params.resultCount} resultados encontrados`;
    const content = `
**Busca realizada por:** ${params.userName}

**Parâmetros:**
- Matrícula: ${params.matricula}
- Cidade: ${params.cidade}
- Estado: ${params.estado}

**Resultados:** ${params.resultCount} registros encontrados

Esta busca retornou um número significativo de resultados e pode requerer análise detalhada.
    `.trim();

    return await notifyOwner({ title, content });
  } catch (error) {
    console.error('[Notifications] Erro ao enviar notificação de resultados críticos:', error);
    return false;
  }
}

/**
 * Notificar proprietário sobre erros recorrentes na API
 * Rastreia erros e notifica quando atingir threshold
 */
let errorCount = 0;
let lastErrorNotification = 0;
const ERROR_THRESHOLD = 5;
const NOTIFICATION_COOLDOWN = 3600000; // 1 hora em ms

export async function notifyRecurrentErrors(errorMessage: string): Promise<boolean> {
  try {
    errorCount++;
    const now = Date.now();

    // Verificar se atingiu threshold e se passou o cooldown
    if (errorCount >= ERROR_THRESHOLD && (now - lastErrorNotification) > NOTIFICATION_COOLDOWN) {
      const title = `⚠️ Alerta: Erros recorrentes na API OSINT`;
      const content = `
**Status:** ${errorCount} erros detectados na última hora

**Último erro:** ${errorMessage}

**Ação recomendada:**
- Verificar status da API SerpApi
- Verificar créditos disponíveis
- Verificar configuração de credenciais (SERPAPI_KEY)
- Verificar conectividade de rede

Os erros podem estar impactando a capacidade de realizar buscas na plataforma.
      `.trim();

      const success = await notifyOwner({ title, content });
      
      if (success) {
        lastErrorNotification = now;
        errorCount = 0; // Reset após notificação bem-sucedida
      }

      return success;
    }

    return false;
  } catch (error) {
    console.error('[Notifications] Erro ao enviar notificação de erros recorrentes:', error);
    return false;
  }
}

/**
 * Resetar contador de erros (chamado após período sem erros)
 */
export function resetErrorCount(): void {
  errorCount = 0;
}

/**
 * Notificar sobre cache hit rate baixo
 */
export async function notifyLowCacheHitRate(stats: {
  totalSearches: number;
  cacheHitRate: number;
}): Promise<boolean> {
  try {
    if (stats.totalSearches < 20) {
      return false; // Não notificar com poucos dados
    }

    if (stats.cacheHitRate < 30) {
      const title = `📊 Alerta: Taxa de cache baixa (${stats.cacheHitRate}%)`;
      const content = `
**Estatísticas:**
- Total de buscas: ${stats.totalSearches}
- Taxa de cache: ${stats.cacheHitRate}%

**Possíveis causas:**
- Buscas muito variadas (baixa repetição)
- TTL do cache muito curto
- Redis não configurado ou indisponível

Uma taxa de cache baixa pode aumentar custos de API e latência das buscas.
      `.trim();

      return await notifyOwner({ title, content });
    }

    return false;
  } catch (error) {
    console.error('[Notifications] Erro ao enviar notificação de cache:', error);
    return false;
  }
}
