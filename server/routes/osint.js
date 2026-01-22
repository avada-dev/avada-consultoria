const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');

// Environment Variables for Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API;
const SERPAPI_KEY = process.env.SERPAPI;
const SCRAPERAPI_KEY = process.env.SCRAPER_API;

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
    const keyExists = !!GEMINI_API_KEY;
    const keyPreview = GEMINI_API_KEY
        ? `${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 5)}`
        : 'NOT SET';

    res.json({
        gemini_key_configured: keyExists,
        gemini_key_preview: keyPreview,
        tavily_configured: !!TAVILY_API_KEY,
        serpapi_configured: !!SERPAPI_KEY,
        scraperapi_configured: !!SCRAPERAPI_KEY,
        env_check: {
            NODE_ENV: process.env.NODE_ENV,
            has_process_env: typeof process.env === 'object'
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
    ]);
    return Array.from(variations).filter(v => v.length > 0);
}

// Helper: Build prompt with new format
function buildServiderPublicoPrompt(matricula, city, state, target_name) {
    const variations = generateMatriculaVariations(matricula);

    return `
Você é um especialista em buscar servidores públicos em documentos oficiais.

**TAREFA**: Localizar DOCUMENTOS que mencionem matrícula **${matricula}** em **${city} - ${state}**.

**DADOS DA BUSCA**:
- Matrícula: ${matricula} (variações: ${variations.join(', ')})
- Nome provável: ${target_name || 'não informado'}
- Local: ${city}/${state}

**REGRAS**:
1. Busque em Diários Oficiais, portais .gov.br, PDFs públicos
2. Para CADA documento encontrado, extraia:
   - Título/ID do documento
   - Trecho literal (máx 120 chars) onde aparece a matrícula
   - Matrícula identificada
   - Cidade mencionada  
   - Estado mencionado
   - URL real (NUNCA "vertexaisearch" - apenas .gov.br, scribd.com, jus.br, etc)
3. Se NÃO encontrar: retorne "❌ Nenhum documento encontrado"
4. NÃO invente dados

**FORMATO DE SAÍDA OBRIGATÓRIO**:

✅ **Resultado 1**: [ID/Título do Doc] | [Tipo: PDF/DO/etc] | [Órgão]
**Documento**: "[Trecho literal onde aparece matrícula - máx 120 chars]..."
✅ **Matrícula**: [número]  
✅ **Cidade**: [cidade]
✅ **Estado**: [sigla UF]
**Link**: [URL direto]

✅ **Resultado 2**: [ID] | [Tipo] | [Órgão]
**Documento**: "[Trecho...]"
✅ **Matrícula**: [número]
✅ **Cidade**: [cidade]
✅ **Estado**: [UF]
**Link**: [URL]

[Continue para todos os resultados]

---
**Total**: [X documentos encontrados]
`.trim();
}

// Helper: Format Context
function formatContext(results, provider) {
    if (!results) return "Nenhum resultado encontrado.";
    return `Resultados de ${provider}:\n\n${JSON.stringify(results, null, 2).substring(0, 30000)}`;
}

// POST Search
router.post('/search', async (req, res) => {
    const { matricula, city, state, target_name, provider } = req.body;

    if (!matricula || !city || !state) {
        return res.status(400).json({ error: 'Dados insuficientes. Informe Matrícula, Cidade e Estado.' });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({
            error: 'Chave Gemini não configurada',
            details: 'GEMINI_API_KEY não definida no Railway'
        });
    }

    const selectedProvider = provider || 'google_grounding';
    console.log(`[OSINT] Busca via ${selectedProvider}: ${matricula} em ${city}/${state}`);

    let aiResponse = "";
    let searchContext = "";

    try {
        const prompt = buildServiderPublicoPrompt(matricula, city, state, target_name);

        // --- GOOGLE GROUNDING ---
        if (selectedProvider === 'google_grounding') {
            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ googleSearch: {} }]
            };

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                requestBody,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 60000
                }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

            // --- TAVILY API ---
        } else if (selectedProvider === 'tavily') {
            if (!TAVILY_API_KEY) {
                return res.status(500).json({ error: 'Tavily API Key não configurada (TAVILY_API)' });
            }

            const searchQuery = `servidor público matrícula ${matricula} ${city} ${state} site:gov.br`;
            const tavilyResponse = await axios.post(
                'https://api.tavily.com/search',
                {
                    api_key: TAVILY_API_KEY,
                    query: searchQuery,
                    search_depth: 'advanced',
                    include_answer: true,
                    max_results: 10
                },
                { timeout: 30000 }
            );

            searchContext = formatContext(tavilyResponse.data, 'Tavily API');
            const analysisPrompt = `${prompt}\n\nDADOS COLETADOS:\n${searchContext}\n\nGere o relatório no formato solicitado.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: analysisPrompt }] }] },
                { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

            // --- SERPAPI ---
        } else if (selectedProvider === 'serpapi') {
            if (!SERPAPI_KEY) {
                return res.status(500).json({ error: 'SerpApi Key não configurada (SERPAPI)' });
            }

            const searchQuery = `servidor público matrícula ${matricula} ${city} ${state}`;
            const serpApiResponse = await axios.get('https://serpapi.com/search', {
                params: {
                    api_key: SERPAPI_KEY,
                    q: searchQuery,
                    engine: 'google',
                    gl: 'br',
                    hl: 'pt',
                    num: 20
                },
                timeout: 30000
            });

            searchContext = formatContext(serpApiResponse.data.organic_results, 'SerpApi');
            const analysisPrompt = `${prompt}\n\nDADOS COLETADOS:\n${searchContext}\n\nGere o relatório no formato solicitado.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: analysisPrompt }] }] },
                { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

            // --- SCRAPERAPI ---
        } else if (selectedProvider === 'scraperapi') {
            if (!SCRAPERAPI_KEY) {
                return res.status(500).json({ error: 'ScraperApi Key não configurada (SCRAPER_API)' });
            }

            const searchQuery = `servidor público matrícula ${matricula} ${city} ${state}`;
            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

            const scraperResponse = await axios.get('https://api.scraperapi.com', {
                params: {
                    api_key: SCRAPERAPI_KEY,
                    url: googleSearchUrl,
                    country_code: 'br'
                },
                timeout: 45000
            });

            searchContext = `Scraped HTML:\n${scraperResponse.data.substring(0, 15000)}`;
            const analysisPrompt = `${prompt}\n\nDADOS COLETADOS:\n${searchContext}\n\nGere o relatório no formato solicitado.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: analysisPrompt }] }] },
                { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        } else {
            return res.status(400).json({ error: 'Provedor inválido' });
        }

        if (!aiResponse) {
            throw new Error('Resposta vazia da AI');
        }

        // Save to DB
        db.run(
            'INSERT INTO osint_searches (user_id, target_name, target_id, city, state, notes, report_content) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, target_name || 'N/A', matricula, city, state, `Busca via ${selectedProvider}`, aiResponse],
            (err) => { if (err) console.error('[OSINT] Erro DB:', err); }
        );

        res.json({ report: aiResponse });

    } catch (error) {
        console.error('[OSINT] Erro:', error.response?.data || error.message);

        if (error.response?.data?.error?.message) {
            const upstreamError = error.response.data.error.message;
            if (upstreamError.includes('API key')) {
                return res.status(500).json({
                    error: 'Chave API Gemini Inválida',
                    details: upstreamError
                });
            }
            return res.status(500).json({ error: 'Erro OSINT', details: upstreamError });
        }

        res.status(500).json({ error: 'Erro ao processar busca', details: error.message });
    }
});

module.exports = router;
