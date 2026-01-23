const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');

// Environment Variables - RECARREGANDO SEMPRE
const getApiKeys = () => ({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API,
    SERPAPI_KEY: process.env.SERPAPI,
    SCRAPERAPI_KEY: process.env.SCRAPER_API
});

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

// DIAGNOSTIC ENDPOINT - ULTRA COMPLETO
router.get('/diagnostic', (req, res) => {
    const keys = getApiKeys();

    const allEnvKeys = Object.keys(process.env).filter(k =>
        k.includes('API') || k.includes('KEY') || k.includes('SERP') || k.includes('TAVILY') || k.includes('SCRAPER') || k.includes('GEMINI')
    );

    const envSnapshot = {};
    allEnvKeys.forEach(key => {
        const val = process.env[key];
        if (val) {
            envSnapshot[key] = `${val.substring(0, 15)}...${val.substring(val.length - 8)} (length: ${val.length})`;
        } else {
            envSnapshot[key] = 'NOT SET или VAZIO';
        }
    });

    res.json({
        TODAS_ENV_VARS_DISPONIVEIS: allEnvKeys,
        VALORES_ATUAIS: envSnapshot,
        ESPERADO_PELO_CODIGO: {
            'process.env.GEMINI_API_KEY': !!keys.GEMINI_API_KEY ? 'CONFIGURADO' : 'VAZIO',
            'process.env.TAVILY_API': !!keys.TAVILY_API_KEY ? 'CONFIGURADO' : 'VAZIO',
            'process.env.SERPAPI': !!keys.SERPAPI_KEY ? 'CONFIGURADO' : 'VAZIO',
            'process.env.SCRAPER_API': !!keys.SCRAPERAPI_KEY ? 'CONFIGURADO' : 'VAZIO'
        },
        INSTRUCOES_RAILWAY: 'Configure as variáveis: GEMINI_API_KEY, TAVILY_API, SERPAPI, SCRAPER_API (EXATAMENTE assim)',
        TESTE_LEITURA: {
            GEMINI_API_KEY: keys.GEMINI_API_KEY || 'VAZIO',
            TAVILY_API: keys.TAVILY_API_KEY || 'VAZIO',
            SERPAPI: keys.SERPAPI_KEY || 'VAZIO',
            SCRAPER_API: keys.SCRAPERAPI_KEY || 'VAZIO'
        }
    });
});

// GET History
router.get('/history', (req, res) => {
    db.all('SELECT * FROM osint_searches WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao carregar histórico' });
        res.json(rows || []);
    });
});

// Helper: Variations of matricula formats
function generateMatriculaVariations(matricula) {
    const clean = matricula.replace(/[^\d]/g, '');
    const variations = new Set([
        matricula,
        clean,
        clean.replace(/(\d{6})(\d)/, '$1-$2'),
        clean.replace(/(\d{3})(\d{3})(\d)/, '$1-$2-$3'),
        clean.replace(/(\d{3})(\d{3})(\d)/, '$1.$2-$3'),
    ]);
    return Array.from(variations).filter(v => v.length > 0);
}

// Helper: Build prompt SEM VEDAÇÃO RESTRITIVA
function buildServiderPublicoPrompt(matricula, city, state, target_name) {
    const variations = generateMatriculaVariations(matricula);

    return `
Você é um especialista em OSINT para buscar servidores públicos brasileiros na internet.

**OBJETIVO**: Localizar **QUALQUER informação** sobre a matrícula **${matricula}**.

**DADOS DA BUSCA**:
- Matrícula procurada: ${matricula} (variações: ${variations.join(', ')})
- Nome: ${target_name || 'não informado'}
- Localização de interesse: ${city}/${state}

**FONTES ACEITAS** (BUSCAR EM TODAS):
- Diários Oficiais (municipal, estadual, federal)
- Portais de Transparência
- Sites de notícias e jornais locais
- Blogs e sites pessoais
- Redes sociais públicas
- Escavador, Jusbrasil, portais jurídicos
- Sites de prefeituras e governos
- Qualquer site público na internet

**INSTRUÇÕES CRÍTICAS**:
1. **MOSTRE TODOS os resultados** que encontrar com a matrícula ${matricula}
2. **NÃO descarte** resultados só porque são de outro estado/cidade
3. Para CADA documento encontrado, extraia:
   - Título/ID do documento
   - Trecho literal (máx 150 chars) com a matrícula
   - Matrícula identificada
   - Cidade mencionada
   - Estado mencionado
   - URL DIRETO (nunca "vertexaisearch")
4. Priorize resultados de ${city}/${state}, mas mostre TODOS.
5. Se não encontrar NADA: "❌ Nenhuma informação encontrada"
6. NÃO invente dados.

**FORMATO DE SAÍDA**:

✅ **Resultado 1**: [Título/Fonte]
**Tipo**: [Diário Oficial / Portal / Blog / etc]
**Trecho**: "[...texto literal...]"
**Matrícula**: [número]
**Local**: [Cidade - Estado]
**Link**: [URL direto]

✅ **Resultado 2**: [Título]
**Tipo**: [tipo]
**Trecho**: "[...]"
**Matrícula**: [número]
**Local**: [Local]
**Link**: [URL]

[Continue para TODOS os resultados]

---
**RESUMO**: [X documentos encontrados]
`.trim();
}

// Helper: Format Context
function formatContext(results, provider) {
    if (!results) return "Nenhum resultado encontrado.";
    return `Resultados de ${provider}:\n\n${JSON.stringify(results, null, 2).substring(0, 40000)}`;
}

// POST Search
router.post('/search', async (req, res) => {
    const { matricula, city, state, target_name, provider } = req.body;

    // RECARREGAR ENV VARS
    const keys = getApiKeys();

    console.log('[OSINT] POST /search recebido');
    console.log('[OSINT] Body:', { matricula, city, state, target_name, provider });
    console.log('[OSINT] ENV Check:', {
        GEMINI: !!keys.GEMINI_API_KEY,
        TAVILY: !!keys.TAVILY_API_KEY,
        SERPAPI: !!keys.SERPAPI_KEY,
        SCRAPER: !!keys.SCRAPERAPI_KEY
    });

    if (!matricula || !city || !state) {
        return res.status(400).json({ error: 'Dados insuficientes. Informe Matrícula, Cidade e Estado.' });
    }

    if (!keys.GEMINI_API_KEY) {
        return res.status(500).json({
            error: 'Chave Gemini não configurada',
            details: 'GEMINI_API_KEY não definida no Railway'
        });
    }

    const selectedProvider = provider || 'tavily';

    // BLOCK Google Grounding
    if (selectedProvider === 'google_grounding') {
        return res.status(400).json({
            error: 'Google Grounding desabilitado',
            details: 'Use Tavily, SerpApi ou ScraperApi'
        });
    }

    console.log(`[OSINT] Provider selecionado: "${selectedProvider}"`);

    let aiResponse = "";
    let searchContext = "";

    try {
        const prompt = buildServiderPublicoPrompt(matricula, city, state, target_name);

        // --- TAVILY API ---
        if (selectedProvider === 'tavily') {
            console.log('[OSINT] Tentando TAVILY...');
            if (!keys.TAVILY_API_KEY) {
                console.error('[OSINT] TAVILY_API_KEY está vazia!');
                return res.status(500).json({
                    error: 'Tavily API Key não configurada (TAVILY_API)',
                    instrucao: 'Configure a variável TAVILY_API no Railway',
                    env_check: Object.keys(process.env).filter(k => k.includes('TAVILY'))
                });
            }

            // BUSCA AMPLA: Sem site:gov.br ou outras restrições
            const searchQuery = `${matricula} "${city}" "${state}" servidor público OR funcionário OR matrícula`;
            console.log('[OSINT] Query Tavily (AMPLA):', searchQuery);

            const tavilyResponse = await axios.post(
                'https://api.tavily.com/search',
                {
                    api_key: keys.TAVILY_API_KEY,
                    query: searchQuery,
                    search_depth: 'advanced',
                    include_answer: true,
                    max_results: 20,
                    include_domains: [],
                    exclude_domains: []
                },
                { timeout: 45000 }
            );

            console.log('[OSINT] Tavily response received');
            searchContext = formatContext(tavilyResponse.data, 'Tavily API');
            const analysisPrompt = `${prompt}\n\nDADOS COLETADOS:\n${searchContext}\n\nGere o relatório COMPLETO.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: analysisPrompt }] }] },
                { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('[OSINT] Gemini analysis complete');

            // --- SERPAPI ---
        } else if (selectedProvider === 'serpapi') {
            console.log('[OSINT] Tentando SERPAPI...');
            if (!keys.SERPAPI_KEY) {
                console.error('[OSINT] SERPAPI_KEY está vazia!');
                return res.status(500).json({
                    error: 'SerpApi Key não configurada (SERPAPI)',
                    instrucao: 'Configure a variável SERPAPI no Railway',
                    env_check: Object.keys(process.env).filter(k => k.includes('SERP'))
                });
            }

            // BUSCA AMPLA
            const searchQuery = `${matricula} ${city} ${state} servidor público`;
            console.log('[OSINT] Query SerpApi (AMPLA):', searchQuery);

            const serpApiResponse = await axios.get('https://serpapi.com/search', {
                params: {
                    api_key: keys.SERPAPI_KEY,
                    q: searchQuery,
                    engine: 'google',
                    gl: 'br',
                    hl: 'pt',
                    num: 40 // Mais resultados
                },
                timeout: 45000
            });

            console.log('[OSINT] SerpApi response received');
            searchContext = formatContext(serpApiResponse.data.organic_results, 'SerpApi');
            const analysisPrompt = `${prompt}\n\nDADOS COLETADOS:\n${searchContext}\n\nGere o relatório COMPLETO.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: analysisPrompt }] }] },
                { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('[OSINT] Gemini analysis complete');

            // --- SCRAPERAPI ---
        } else if (selectedProvider === 'scraperapi') {
            console.log('[OSINT] Tentando SCRAPERAPI...');
            if (!keys.SCRAPERAPI_KEY) {
                console.error('[OSINT] SCRAPERAPI_KEY está vazia!');
                return res.status(500).json({
                    error: 'ScraperApi Key não configurada (SCRAPER_API)',
                    instrucao: 'Configure a variável SCRAPER_API no Railway',
                    env_check: Object.keys(process.env).filter(k => k.includes('SCRAPER'))
                });
            }

            // BUSCA AMPLA
            const searchQuery = `${matricula} ${city} ${state}`;
            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=40`;
            console.log('[OSINT] Query ScraperApi (AMPLA):', googleSearchUrl);

            const scraperResponse = await axios.get('https://api.scraperapi.com', {
                params: {
                    api_key: keys.SCRAPERAPI_KEY,
                    url: googleSearchUrl,
                    country_code: 'br'
                },
                timeout: 60000
            });

            console.log('[OSINT] ScraperApi response received');
            searchContext = `Scraped HTML:\n${scraperResponse.data.substring(0, 30000)}`;
            const analysisPrompt = `${prompt}\n\nDADOS COLETADOS:\n${searchContext}\n\nGere o relatório COMPLETO.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: analysisPrompt }] }] },
                { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('[OSINT] Gemini analysis complete');

        } else {
            return res.status(400).json({ error: `Provedor inválido: "${selectedProvider}". Use: tavily, serpapi ou scraperapi` });
        }

        if (!aiResponse) {
            throw new Error('Resposta vazia da AI');
        }

        // Save to DB
        db.run(
            'INSERT INTO osint_searches (user_id, target_name, target_id, city, state, notes, report_content) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, target_name || 'N/A', matricula, city, state, `Busca via ${selectedProvider}`, aiResponse],
            (err) => {
                if (err) console.error('[OSINT] Erro DB:', err.message);
            }
        );

        console.log('[OSINT] Success - returning report');
        res.json({ report: aiResponse });

    } catch (error) {
        console.error('[OSINT] ERRO COMPLETO:', error.response?.data || error.message);

        if (error.response?.data?.error?.message) {
            const msg = error.response.data.error.message;
            return res.status(500).json({ error: 'Erro API Provedor', details: msg, provider: selectedProvider });
        }

        res.status(500).json({ error: 'Erro ao processar busca', details: error.message, provider: selectedProvider });
    }
});

module.exports = router;
