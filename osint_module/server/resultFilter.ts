import type { SearchParams, SearchResult } from './serpapi';

/**
 * Estados e suas variações para validação geográfica
 */
const ESTADO_VARIATIONS: Record<string, string[]> = {
  'AC': ['Acre', 'acre'],
  'AL': ['Alagoas', 'alagoas'],
  'AP': ['Amapá', 'amapa', 'Amapá', 'amapá'],
  'AM': ['Amazonas', 'amazonas'],
  'BA': ['Bahia', 'bahia'],
  'CE': ['Ceará', 'ceara', 'Ceará', 'ceará'],
  'DF': ['Brasília', 'brasilia', 'Distrito Federal', 'distrito federal'],
  'ES': ['Espírito Santo', 'espírito santo', 'Espirito Santo', 'espirito santo'],
  'GO': ['Goiás', 'goias', 'Goiás', 'goiás'],
  'MA': ['Maranhão', 'maranhao', 'Maranhão', 'maranhão'],
  'MT': ['Mato Grosso', 'mato grosso'],
  'MS': ['Mato Grosso do Sul', 'mato grosso do sul'],
  'MG': ['Minas Gerais', 'minas gerais'],
  'PA': ['Pará', 'para', 'Pará', 'pará'],
  'PB': ['Paraíba', 'paraiba', 'Paraíba', 'paraíba'],
  'PR': ['Paraná', 'parana', 'Paraná', 'paraná'],
  'PE': ['Pernambuco', 'pernambuco'],
  'PI': ['Piauí', 'piaui', 'Piauí', 'piauí'],
  'RJ': ['Rio de Janeiro', 'rio de janeiro'],
  'RN': ['Rio Grande do Norte', 'rio grande do norte'],
  'RS': ['Rio Grande do Sul', 'rio grande do sul'],
  'RO': ['Rondônia', 'rondonia', 'Rondônia', 'rondônia'],
  'RR': ['Roraima', 'roraima'],
  'SC': ['Santa Catarina', 'santa catarina'],
  'SP': ['São Paulo', 'sao paulo', 'São Paulo', 'são paulo'],
  'SE': ['Sergipe', 'sergipe'],
  'TO': ['Tocantins', 'tocantins'],
};

/**
 * Verificar se o resultado menciona a matrícula
 */
function containsMatricula(text: string, matricula: string): boolean {
  const cleanMatricula = matricula.trim();
  const patterns = [
    cleanMatricula,
    `matrícula ${cleanMatricula}`,
    `matrícula nº ${cleanMatricula}`,
    `matrícula n° ${cleanMatricula}`,
    `matrícula n. ${cleanMatricula}`,
    `mat. ${cleanMatricula}`,
    `mat ${cleanMatricula}`,
  ];
  
  const lowerText = text.toLowerCase();
  return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

/**
 * Verificar se o resultado menciona o estado correto
 */
function containsCorrectState(text: string, estado: string): boolean {
  const variations = ESTADO_VARIATIONS[estado.toUpperCase()] || [];
  const lowerText = text.toLowerCase();
  
  return variations.some(variation => lowerText.includes(variation.toLowerCase()));
}

/**
 * Verificar se o resultado menciona a cidade correta
 */
function containsCorrectCity(text: string, cidade: string, estado: string): boolean {
  const cleanCidade = cidade.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Buscar pela cidade
  if (lowerText.includes(cleanCidade)) {
    // Verificar se também menciona o estado correto
    return containsCorrectState(text, estado);
  }
  
  return false;
}

/**
 * Verificar se é uma página institucional genérica (sem relação com matrícula)
 */
function isGenericInstitutionalPage(title: string, snippet: string): boolean {
  const genericPatterns = [
    /^(portal|site|página|website).*(oficial|institucional)/i,
    /^(bem-vindo|bem vindo|welcome)/i,
    /^(sobre|about|contato|contact)/i,
    /^(serviços|services|informações|information)/i,
    /^(polícia militar|pm|polícia|police)/i,
    /^(secretaria|ministry|secretário)/i,
    /^(governo|government|state|estado)/i,
  ];
  
  const fullText = `${title} ${snippet}`.toLowerCase();
  
  // Se é apenas uma página institucional sem mencionar matrícula específica
  return genericPatterns.some(pattern => pattern.test(title)) && 
         !fullText.includes('matrícula') && 
         !fullText.includes('mat.');
}

/**
 * Filtrar resultados para manter apenas os relacionados à matrícula
 */
export function filterRelevantResults(
  results: SearchResult[],
  params: SearchParams
): SearchResult[] {
  return results.filter(result => {
    const fullText = `${result.title} ${result.snippet}`;
    
    // 1. Deve conter a matrícula específica
    if (!containsMatricula(fullText, params.matricula)) {
      console.log(`[Filter] Resultado rejeitado (sem matrícula): ${result.title}`);
      return false;
    }
    
    // 2. Deve mencionar o estado correto
    if (!containsCorrectState(fullText, params.estado)) {
      console.log(`[Filter] Resultado rejeitado (estado incorreto): ${result.title}`);
      return false;
    }
    
    // 3. Se cidade foi especificada, deve mencionar a cidade
    if (params.cidade && params.cidade.trim()) {
      if (!containsCorrectCity(fullText, params.cidade, params.estado)) {
        console.log(`[Filter] Resultado rejeitado (cidade incorreta): ${result.title}`);
        return false;
      }
    }
    
    // 4. Rejeitar páginas institucionais genéricas
    if (isGenericInstitutionalPage(result.title, result.snippet)) {
      console.log(`[Filter] Resultado rejeitado (página genérica): ${result.title}`);
      return false;
    }
    
    console.log(`[Filter] Resultado aceito: ${result.title}`);
    return true;
  });
}

/**
 * Validar se há resultados relevantes após filtro
 */
export function hasRelevantResults(filteredResults: SearchResult[]): boolean {
  return filteredResults.length > 0;
}
