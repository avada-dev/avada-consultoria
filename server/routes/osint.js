const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');

// Environment Variables - Robust Key Check
const getApiKeys = () => {
    return {
        // Tenta variações comuns de nomes de variáveis
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

// DIAGNOSTIC ENDPOINT
router.get('/diagnostic', (req, res) => {
    const keys = getApiKeys();

    // Debug variables status
    const debugKeys = {
        TAVILY: !!keys.TAVILY,
        SERPAPI: !!keys.SERPAPI,
        SCRAPER: !!keys.SCRAPER
    };

    res.json({
        STATUS: 'Online',
        CHAVES_DETECTADAS: debugKeys,
        VARIAVEIS_AMBIENTE_LIDAS: Object.keys(process.env).filter(k =>
            k.includes('API') || k.includes('KEY') || k.includes('SERP') || k.includes('TAVILY') || k.includes('SCRAPER')
        )
    });
});

// GET History
router.get('/history', (req, res) => {
    db.all('SELECT * FROM osint_searches WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao carregar histórico' });
        res.json(rows || []);
    });
});

// --- MANUAL FORMATTING & SORTING (NO FILTERING) ---

function normalizeStr(str) {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Ordena resultados: Cidade solicitada no topo
function sortItemsByRelevance(items, city, state) {
    const normCity = normalizeStr(city);
    const normState = normalizeStr(state);

    return items.sort((a, b) => {
        const textA = normalizeStr((a.title || "") + " " + (a.snippet || ""));
        const textB = normalizeStr((b.title || "") + " " + (b.snippet || ""));

        let scoreA = 0;
        let scoreB = 0;

        // Peso ALTO para cidade correta
        if (normCity && textA.includes(normCity)) scoreA += 100;
        // Peso MÉDIO para estado correto
        if (normState && textA.includes(normState)) scoreA += 10;

        if (normCity && textB.includes(normCity)) scoreB += 100;
        if (normState && textB.includes(normState)) scoreB += 10;

        return scoreB - scoreA; // Descrescente (maior score primeiro)
    });
}

// Formata os resultados SEM FILTRAR NADA, APENAS ORDENA
function formatResults(results, matricula, city, state, provider) {
    let report = `### 🔎 Resultados da Busca (WEB)\n`;
    report += `**Matrícula**: ${matricula}\n`;
    report += `**Local Solicitado**: ${city}/${state}\n`;
    report += `**Fonte**: ${provider.toUpperCase()}\n\n`;

    let items = [];

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
    } else if (provider === 'scraperapi') {
        return `### HTML Bruto (ScraperApi)\n\nA ScraperApi retornou o conteúdo bruto. O Visualizador não suporta HTML raw.\n\nQuery: ${matricula} ${city}`;
    }

    if (items.length === 0) {
        return report + `\n❌ **Nenhum resultado retornado pela API.**\nVerifique se a matrícula e os termos estão corretos.`;
    }

    // ORDENAR POR RELEVÂNCIA (Cidade solicitada no topo)
    const sortedItems = sortItemsByRelevance(items, city, state);

    // EXIBIR TUDO (Sorted)
    sortedItems.forEach((item, index) => {
        const text = normalizeStr((item.title || "") + " " + (item.snippet || ""));
        const normCity = normalizeStr(city);

        // Marca visualmente se é da cidade buscada
        const isMatch = normCity && text.includes(normCity);
        const icon = isMatch ? "⭐" : "📄";

        report += `#### ${icon} Resultado ${index + 1}: ${item.title}\n`;
        report += `🔗 [Acessar Link](${item.link})\n`;
        report += `📝 "${item.snippet}"\n\n`;
        report += `---\n`;
    });

    report += `\n**Total de Resultados**: ${items.length}`;
    if (items.length > 0) {
        report += `\n*(⭐ = Relevância alta para ${city})*`;
    }

    return report;
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

    // Query de busca ampla
    const searchQuery = `Matricula ${matricula}`;

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
                    query: `${searchQuery} ${city} ${state}`,
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
                    location: `${city}, State of ${state}, Brazil`, // Tenta geolocalizar a busca
                    num: 20
                },
                timeout: 45000
            });

            report = formatResults(serpApiResponse.data.organic_results || [], matricula, city, state, 'serpapi');

            // --- SCRAPERAPI ---
        } else if (selectedProvider === 'scraperapi') {
            if (!keys.SCRAPER) {
                return res.status(500).json({ error: 'Chave API ScraperApi não encontrada.' });
            }

            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + " " + city + " " + state)}`;
            console.log('[OSINT] Consultando ScraperApi:', googleUrl);

            const scraperResponse = await axios.get('https://api.scraperapi.com', {
                params: {
                    api_key: keys.SCRAPER,
                    url: googleUrl,
                    country_code: 'br'
                },
                timeout: 60000
            });

            report = `### Resultado ScraperApi\n\nConteúdo HTML recebido.`;

        } else {
            return res.status(400).json({ error: 'Provedor inválido.' });
        }

        // Salvar (Sem IA)
        db.run(
            'INSERT INTO osint_searches (user_id, target_name, target_id, city, state, notes, report_content) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, target_name || 'N/A', matricula, city, state, `Provedor: ${selectedProvider} | Sorted`, report],
            (err) => { }
        );

        res.json({ report: report });

    } catch (error) {
        console.error('[OSINT] Erro:', error.message);
        res.status(500).json({ error: 'Erro ao executar busca', details: error.message });
    }
});

module.exports = router;
