const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');

// Environment Variables - Robust Key Check
const getApiKeys = () => {
    return {
        // Tenta ler variaveis padrao e as personalizadas do Railway (baseado no screenshot)
        TAVILY: process.env.TAVILY_API || process.env.TAVILY_API_KEY || process.env.TAVILY_KEY,
        SERPAPI: process.env.SERPAPI || process.env.SERPAPI_KEY || process.env.SERP_API_KEY,
        SCRAPER: process.env.SCRAPER_API || process.env.SCRAPERAPI_KEY || process.env.SCRAPER_KEY
    };
};

// Middleware to check auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET || 'avada_consultoria_secret_key_2026_traffic_law_system', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

router.use(authenticateToken);

// --- DIAGNOSTIC ENDPOINT (Mantido para debug) ---
router.get('/diagnostic', (req, res) => {
    const keys = getApiKeys();
    const envStatus = {
        TAVILY: keys.TAVILY ? 'CONFIGURADA (OK)' : 'VAZIA (ERRO)',
        SERPAPI: keys.SERPAPI ? 'CONFIGURADA (OK)' : 'VAZIA (ERRO)',
        SCRAPERAPI: keys.SCRAPER ? 'CONFIGURADA (OK)' : 'VAZIA (ERRO)',
    };

    // Lista segura de vars (sem mostrar conteudo sensivel)
    const debugVars = Object.keys(process.env)
        .filter(key => key.includes('API') || key.includes('KEY') || key.includes('SECRET') || key.includes('SERP') || key.includes('TAVILY'))
        .map(key => `${key}: ${process.env[key] ? '*****' + process.env[key].slice(-4) : 'UNDEFINED'}`);

    res.json({
        status: 'OSINT Module Active',
        keys_status: envStatus,
        detected_env_vars: debugVars
    });
});

// --- HELPER FUNCTIONS ---

function normalizeStr(str) {
    return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
}

// Filtro Rigoroso (Vedação Total)
function isResultValid(item, city, matriculaStr) {
    const title = normalizeStr(item.title || "");
    const snippet = normalizeStr(item.snippet || "");
    const link = (item.link || "").toLowerCase();
    const fullText = `${title} ${snippet}`;
    const cityNorm = normalizeStr(city);

    // 1. BLACKLIST DE PALAVRAS (Veto Imediato)
    const blacklist = [
        "leilao", "leiloes", "megaleiloes", "superbid", "lance", "arrematacao", // Leilões
        "venda", "aluguel", "terreno", "residencial", "loteamento", "imovel", "imobiliaria", // Imóveis
        "google play", "app store", "tiktok", "instagram", "facebook", "youtube", "twitter", // Redes Sociais/Apps
        "youtube.com", "facebook.com", "instagram.com", "formula 1", "grand prix", "schedule", "calendar", "corrida", // Lixo/F1
        "game", "jogo", "bet", "apostas", // Lixo diverso
        "receita federal", "cnpj", "socios", "empresa", // Dados empresariais
        "banco", "divida", "fiduciario" // Financeiro
    ];

    for (const badWord of blacklist) {
        if (fullText.includes(badWord) || link.includes(badWord)) {
            return false; // Descartado por blacklist
        }
    }

    // 2. OBRIGATORIEDADE DA CIDADE E DA MATRÍCULA
    // O resultado TEM que ter o nome da cidade E o número da matrícula.
    if (cityNorm && !fullText.includes(cityNorm)) {
        return false; // Descartado: não menciona a cidade
    }

    // Normaliza matricula remove traços/pontos para verificação flexivel
    const cleanMat = matriculaStr.replace(/[^a-zA-Z0-9]/g, '');
    const cleanText = fullText.replace(/[^a-zA-Z0-9]/g, '');

    if (!cleanText.includes(cleanMat)) {
        return false; // Descartado: não menciona a matrícula
    }

    // 3. CONTEXTO POSITIVO OBRIGATÓRIO
    // O resultado TEM que ter algum cheiro de servidor público
    const whitelist = [
        "servidor", "cargo", "portaria", "decreto", "diario", "oficial",
        "transparencia", "admissao", "folha", "matricula", "lotacao",
        "remuneracao", "publico", "municipal", "estadual", "federal",
        "secretaria", "prefeitura", "governo"
    ];

    // Verifica se tem pelo menos UMA palavra da whitelist
    const hasContext = whitelist.some(w => fullText.includes(w));
    if (!hasContext) return false;

    return true; // Passou no filtro rigoroso
}


function formatResults(results, matricula, city, state, provider) {
    let report = `### Relatório de Busca (WEB) - ${provider.toUpperCase()} [v3.0 Blindado]\n\n`;
    report += `**Alvo:** Matrícula ${matricula}\n`;
    report += `**Local:** ${city}/${state}\n\n`;

    let items = [];

    // Normalização de dados dos provedores
    if (provider === 'tavily') {
        if (Array.isArray(results.results)) {
            items = results.results.map(item => ({
                title: item.title,
                link: item.url,
                snippet: item.content || item.raw_content || ''
            }));
        }
    } else if (provider === 'serpapi') {
        if (Array.isArray(results)) {
            items = results.map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet || ''
            }));
        }
    }

    if (items.length === 0) {
        return report + `\n❌ **Nenhum resultado bruto retornado pela API.**\nTente outra fonte ou verifique a matrícula.`;
    }

    // --- FILTRAGEM RIGOROSA ---
    let validItems = items.filter(item => {
        const isValid = isResultValid(item, city, matricula);
        if (!isValid) {
            console.log(`[OSINT FILTER] Rejeitado: "${item.title}" (Não contém matrícula '${matricula}' ou contexto insuficiente)`);
        }
        return isValid;
    });

    if (validItems.length === 0) {
        return report + `\n🚫 **Busca Blindada: Nenhum resultado seguro encontrado.**\n\nO sistema encontrou ${items.length} páginas brutas (lixo, anúncios, parciais), mas **TODAS** foram bloqueadas pelo filtro de segurança porque não continham EXPLICITAMENTE o número da matrícula **${matricula}** junto com dados de servidor público na cidade de **${city}**.\n\nIsso protege você de ver resultados irrelevantes.`;
    }

    // --- ORDENAÇÃO POR PRIORIDADE ---
    const sortedItems = sortItemsByRelevance(validItems, city, state);

    // --- EXIBIÇÃO ---
    sortedItems.forEach((item, index) => {
        report += `#### ⭐ Resultado ${index + 1}: ${item.title}\n`;
        report += `🔗 [Acessar Link](${item.link})\n`;
        report += `📝 "${item.snippet}"\n\n`;
        report += `---\n`;
    });

    report += `\n**Total de Resultados Relevantes**: ${validItems.length} (de ${items.length} brutos)`;
    return report;
}

function sortItemsByRelevance(items, city, state) {
    const priorityTerms = [
        "sd pm", "pm", "policia militar", "guarda municipal", "policia municipal",
        "guarda civil", "oficial pm", "sargento", "cabo pm", "tenente",
        "promocoes de soldados pm", "soldado", "agente de transito",
        "agente da autoridade de transito", "detran", "demutran", "cet",
        "transito", "prefeitura", "secretaria", "servidor"
    ];

    return items.sort((a, b) => {
        const textA = normalizeStr((a.title || "") + " " + (a.snippet || ""));
        const textB = normalizeStr((b.title || "") + " " + (b.snippet || ""));

        // Prioridade Absoluta: Termos Militares/Trânsito
        const hasPriorityA = priorityTerms.some(term => textA.includes(term));
        const hasPriorityB = priorityTerms.some(term => textB.includes(term));

        if (hasPriorityA && !hasPriorityB) return -1;
        if (!hasPriorityA && hasPriorityB) return 1;

        return 0;
    });
}


// POST Search
router.post('/search', async (req, res) => {
    const { matricula, city, state, target_name, provider } = req.body;
    const keys = getApiKeys();

    console.log(`[OSINT] Busca: ${matricula} | ${city}/${state} | ${provider}`);

    if (!matricula) {
        return res.status(400).json({ error: 'Informe a Matrícula.' });
    }

    const selectedProvider = provider || 'serpapi';

    if (selectedProvider === 'google_grounding' || selectedProvider === 'gemini') {
        return res.status(400).json({ error: 'Gemini desativado pelo usuário.' });
    }

    let report = "";

    // QUERY REFINADA E EXATA + KEYWORDS OBRIGATÓRIAS
    // Ex: "Matricula 12345" "Jau" "SP" (servidor OR cargo OR portaria ...) -leilao ...
    // Nota: O '-' (negativo) funciona bem no Google/SerpApi.
    const queryBase = `"Matricula ${matricula}"`; // Removido City/State da query base para evitar restrição excessiva na busca inicial, mas mantido no filtro
    const positiveKeywords = `"${city}" "${state}" (servidor OR cargo OR portaria OR decreto OR "diario oficial" OR transparencia OR folha OR admissao)`;
    const negativeKeywords = `-leilao -leiloes -imovel -terreno -venda -casa -apartamento -cartorio -fiduciario -formula1 -grandprix`;

    const searchQuery = `${queryBase} ${positiveKeywords} ${negativeKeywords}`;

    try {
        // --- TAVILY API ---
        if (selectedProvider === 'tavily') {
            if (!keys.TAVILY) {
                return res.status(500).json({ error: 'Chave API Tavily não encontrada.' });
            }

            console.log('[OSINT] Consultando Tavily:', searchQuery);

            const tavilyResponse = await axios.post(
                'https://api.tavily.com/search',
                {
                    api_key: keys.TAVILY,
                    query: searchQuery,
                    search_depth: 'advanced',
                    include_answer: false,
                    max_results: 20
                },
                { timeout: 45000 }
            );

            report = formatResults({ results: tavilyResponse.data.results }, matricula, city, state, 'tavily');

            // --- SERPAPI ---
        } else if (selectedProvider === 'serpapi') {
            if (!keys.SERPAPI) {
                return res.status(500).json({ error: 'Chave API SerpApi não encontrada.' });
            }

            console.log('[OSINT] Consultando SerpApi:', searchQuery);

            const serpApiResponse = await axios.get('https://serpapi.com/search', {
                params: {
                    api_key: keys.SERPAPI,
                    q: searchQuery,
                    engine: 'google',
                    gl: 'br',
                    hl: 'pt',
                    num: 40
                },
                timeout: 45000
            });

            report = formatResults(serpApiResponse.data.organic_results || [], matricula, city, state, 'serpapi');

            // --- SCRAPERAPI ---
        } else if (selectedProvider === 'scraperapi') {
            if (!keys.SCRAPER) {
                return res.status(500).json({ error: 'Chave API ScraperApi não encontrada.' });
            }

            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            console.log('[OSINT] Consultando ScraperApi:', googleUrl);

            // Tenta obter JSON
            const scraperResponse = await axios.get('https://api.scraperapi.com', {
                params: {
                    api_key: keys.SCRAPER,
                    url: googleUrl,
                    country_code: 'br',
                    autoparse: 'true'
                },
                timeout: 60000
            });

            if (scraperResponse.data && scraperResponse.data.organic_results) {
                report = formatResults(scraperResponse.data.organic_results || [], matricula, city, state, 'serpapi');
            } else {
                // Fallback se autoparse falhar, mas avisando que pode ser HTML sujo
                console.log('[OSINT] ScraperApi não retornou JSON estruturado. Resposta bruta tipo:', typeof scraperResponse.data);
                if (typeof scraperResponse.data === 'string' && scraperResponse.data.includes('<!DOCTYPE html>')) {
                    report = `### Resultado ScraperApi\n\nA API retornou HTML bruto não processável.\nO modo 'autoparse' não conseguiu extrair dados estruturados desta busca.\nRecomendado usar **SerpApi** ou **Tavily** para esta consulta específica.`;
                } else {
                    // Tentar salvar o que veio
                    report = `### Resultado ScraperApi\n\nDados recebidos, mas formato não reconhecido pelo formatador.\n(Veja logs para detalhes)`;
                }
            }

        } else {
            return res.status(400).json({ error: 'Provedor inválido.' });
        }

        // Salvar
        db.run(
            'INSERT INTO osint_searches (user_id, target_name, target_id, city, state, notes, report_content) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, target_name || 'N/A', matricula, city, state, `Provedor: ${selectedProvider} | Strict Filter`, report],
            (err) => { }
        );

        res.json({ report: report });

    } catch (error) {
        console.error('[OSINT] Erro:', error.message);
        if (error.response) {
            console.error('[OSINT] Detalhes do Erro (Response):', JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).json({ error: 'Erro ao executar busca', details: error.message });
    }
});

module.exports = router;
