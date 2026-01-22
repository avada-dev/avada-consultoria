import GoogleSearchResultsNode from 'google-search-results-nodejs';
const GoogleSearch = GoogleSearchResultsNode.GoogleSearch;

export interface SearchParams {
  matricula: string;
  cidade: string;
  estado: string;
  orgao?: string;
  cargo?: string;
}

export interface SearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

export interface SerpApiResponse {
  organic_results: SearchResult[];
  search_metadata?: {
    total_time_taken?: number;
  };
}

/**
 * Construir query string com variações de matrícula e contexto geográfico obrigatório
 * Implementa a lógica booleana estrita conforme blueprint
 */
export function buildQueryString(params: SearchParams): string {
  const cleanMatricula = params.matricula.trim();
  
  // Criar todas as variações de matrícula com aspas duplas para busca exata
  const variations = [
    `"Matrícula ${cleanMatricula}"`,
    `"Matrícula nº ${cleanMatricula}"`,
    `"Matrícula n° ${cleanMatricula}"`,
    `"Matrícula n. ${cleanMatricula}"`,
    `"Mat. ${cleanMatricula}"`
  ];
  
  // Agrupar variações com operador OR e parênteses obrigatórios
  const matriculaQuery = `(${variations.join(' OR ')})`;
  
  // Contexto geográfico obrigatório com aspas duplas
  const geoQuery = `"${params.cidade.trim()}" "${params.estado.trim().toUpperCase()}"`;
  
  // Parâmetros opcionais (sem aspas para permitir flexibilidade semântica)
  let optionalQuery = '';
  if (params.orgao && params.orgao.trim()) {
    optionalQuery += ` ${params.orgao.trim()}`;
  }
  if (params.cargo && params.cargo.trim()) {
    optionalQuery += ` ${params.cargo.trim()}`;
  }
  
  // Query final: (variações de matrícula) + contexto geográfico + opcionais
  return `${matriculaQuery} ${geoQuery}${optionalQuery}`;
}

/**
 * Construir query simplificada (sem variações de matrícula)
 */
function buildSimplifiedQuery(params: SearchParams): string {
  const cleanMatricula = params.matricula.trim();
  const geoQuery = `"${params.cidade.trim()}" "${params.estado.trim().toUpperCase()}"`;
  let optionalQuery = '';
  if (params.orgao && params.orgao.trim()) {
    optionalQuery += ` "${params.orgao.trim()}"`;
  }
  if (params.cargo && params.cargo.trim()) {
    optionalQuery += ` "${params.cargo.trim()}"`;
  }
  return `"${cleanMatricula}" ${geoQuery}${optionalQuery}`;
}

/**
 * Construir query com apenas matrícula e contexto geográfico
 */
function buildMinimalQuery(params: SearchParams): string {
  const cleanMatricula = params.matricula.trim();
  const geoQuery = `"${params.cidade.trim()}" "${params.estado.trim().toUpperCase()}"`;
  return `"${cleanMatricula}" ${geoQuery}`;
}

/**
 * Construir query com órgão entre aspas para maior precisão
 */
function buildOrgaoFocusedQuery(params: SearchParams): string {
  const cleanMatricula = params.matricula.trim();
  const geoQuery = `"${params.cidade.trim()}" "${params.estado.trim().toUpperCase()}"`;
  let query = `"${cleanMatricula}" ${geoQuery}`;
  if (params.orgao && params.orgao.trim()) {
    query += ` "${params.orgao.trim()}"`;
  }
  return query;
}

/**
 * Construir query com apenas matrícula (fallback final)
 */
function buildMatriculaOnlyQuery(params: SearchParams): string {
  return params.matricula.trim();
}

/**
 * Executar busca na SerpApi com configuração paramétrica específica
 */
export async function executeSerpApiSearch(queryString: string): Promise<SerpApiResponse> {
  const apiKey = process.env.SERPAPI_KEY;
  
  if (!apiKey) {
    throw new Error('SERPAPI_KEY não configurada');
  }

  const params = {
    engine: 'google',
    q: queryString,
    google_domain: 'google.com.br',
    gl: 'br',
    hl: 'pt-br',
    num: 20,
    safe: 'active',
    nfpr: 1,
    api_key: apiKey,
  };

  return new Promise((resolve, reject) => {
    const search = new GoogleSearch(apiKey);
    search.json(params, (data: any) => {
      if (data.error) {
        reject(new Error(data.error));
      } else {
        resolve({
          organic_results: data.organic_results || [],
          search_metadata: data.search_metadata,
        });
      }
    });
  });
}

/**
 * Executar busca com retry automático para timeouts
 */
export async function searchWithRetry(
  queryString: string,
  maxRetries: number = 2
): Promise<SerpApiResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[SerpApi] Tentativa ${attempt + 1}/${maxRetries + 1}`);
      const result = await executeSerpApiSearch(queryString);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`[SerpApi] Erro na tentativa ${attempt + 1}:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[SerpApi] Aguardando ${delay}ms antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Falha na busca após múltiplas tentativas');
}

/**
 * Executar busca com fallback inteligente
 * Tenta múltiplas estratégias de query para maximizar taxa de sucesso
 */
export async function searchWithFallback(params: SearchParams): Promise<SerpApiResponse & { queryUsed: string }> {
  const strategies = [
    { name: 'Booleana Completa', query: buildQueryString(params) },
    { name: 'Simplificada', query: buildSimplifiedQuery(params) },
    ...(params.orgao ? [{ name: 'Órgão Focado', query: buildOrgaoFocusedQuery(params) }] : []),
    { name: 'Mínima', query: buildMinimalQuery(params) },
    { name: 'Matrícula Apenas', query: buildMatriculaOnlyQuery(params) },
  ];

  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      console.log(`[SerpApi] Tentando estratégia: ${strategy.name}`);
      console.log(`[SerpApi] Query: ${strategy.query}`);
      const result = await searchWithRetry(strategy.query, 1);
      
      if (result.organic_results && result.organic_results.length > 0) {
        console.log(`[SerpApi] Sucesso com estratégia: ${strategy.name} (${result.organic_results.length} resultados)`);
        return { ...result, queryUsed: strategy.query };
      } else {
        console.log(`[SerpApi] Nenhum resultado com estratégia: ${strategy.name}`);
        lastError = new Error(`Nenhum resultado encontrado com estratégia: ${strategy.name}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`[SerpApi] Erro com estratégia ${strategy.name}:`, error);
    }
  }

  throw lastError || new Error('Nenhum resultado encontrado. Verifique a matrícula e tente novamente.');
}

/**
 * Sanitizar entrada do usuário para prevenir injeção
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/[\(\)]/g, '')
    .trim();
}

/**
 * Validar parâmetros de busca
 */
export function validateSearchParams(params: SearchParams): { valid: boolean; error?: string } {
  if (!params.matricula || !params.matricula.trim()) {
    return { valid: false, error: 'Matrícula é obrigatória' };
  }
  
  if (!params.cidade || !params.cidade.trim()) {
    return { valid: false, error: 'Cidade é obrigatória' };
  }
  
  if (!params.estado || !params.estado.trim()) {
    return { valid: false, error: 'Estado é obrigatório' };
  }
  
  const matriculaRegex = /^[a-zA-Z0-9\-\.\/]+$/;
  if (!matriculaRegex.test(params.matricula.trim())) {
    return { 
      valid: false, 
      error: 'Matrícula contém caracteres inválidos. Use apenas letras, números e separadores (-, ., /)' 
    };
  }
  
  if (params.estado.trim().length !== 2) {
    return { valid: false, error: 'Estado deve ser uma sigla de 2 letras (ex: SP, RJ, MG)' };
  }
  
  return { valid: true };
}
