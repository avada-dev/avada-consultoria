const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database'); // Adjust path as needed based on server structure

// Environment Variables for Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

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

// GET History
router.get('/history', (req, res) => {
    db.all('SELECT * FROM osint_searches WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Helper: Format Context for Gemini
function formatContext(results, provider) {
    if (!results) return "Nenhum resultado bruto encontrado.";
    return `Resultados extraídos via ${provider}:\n\n${JSON.stringify(results, null, 2).substring(0, 30000)}`; // Limit context size
}

// POST Search
router.post('/search', async (req, res) => {
    const { matricula, city, state, target_name, provider } = req.body;

    if (!matricula || !city || !state) {
        return res.status(400).json({ error: 'Dados insuficientes. Informe Matrícula, Cidade e Estado.' });
    }

    const selectedProvider = provider || 'google_grounding';
    console.log(`[OSINT] Iniciando busca via ${selectedProvider} para ${matricula}`);

    let aiResponse = "";
    let searchContext = "";

    try {
        // --- STRATEGY 1: NATIVE GOOGLE GROUNDING (DEFAULT) ---
        if (selectedProvider === 'google_grounding') {
            const prompt = `
                Atue como um especialista em OSINT.
                Investigue: ${matricula}, ${target_name || ''} em ${city}-${state}.
                Busque por vínculos públicos, diários oficiais e processos.
                Retorne um relatório Markdown detalhado.
            `;

            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.3 } } }]
            };

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                requestBody,
                { headers: { 'Content-Type': 'application/json' } }
            );
            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

            // --- STRATEGY 2: TAVILY API ---
        } else if (selectedProvider === 'tavily') {
            if (!TAVILY_API_KEY) throw new Error('Chave Tavily não configurada.');

            const query = `Servidor público matrícula ${matricula} ${city} ${state} ${target_name || ''} diario oficial portal transparencia`;
            const tavilyResponse = await axios.post('https://api.tavily.com/search', {
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: "advanced",
                include_answer: true
            });

            searchContext = formatContext(tavilyResponse.data, 'Tavily');

            // --- STRATEGY 3: SERPAPI ---
        } else if (selectedProvider === 'serpapi') {
            if (!SERPAPI_KEY) throw new Error('Chave SerpApi não configurada.');

            const query = `Servidor público ${matricula} ${city} ${state} filetype:pdf OR site:.gov.br`;
            const serpResponse = await axios.get(`https://serpapi.com/search`, {
                params: {
                    api_key: SERPAPI_KEY,
                    q: query,
                    location: "Brazil",
                    hl: "pt-br",
                    gl: "br"
                }
            });

            searchContext = formatContext(serpResponse.data.organic_results, 'SerpApi');

            // --- STRATEGY 4: SCRAPERAPI ---
        } else if (selectedProvider === 'scraperapi') {
            if (!SCRAPERAPI_KEY) throw new Error('Chave ScraperApi não configurada.');

            // ScraperAPI is a proxy. We need to scrape a specific target. 
            // Since we don't have a URL, we'll try to scrape a Google Search Result page directly (risky but common)
            // or just inform limitation. Actually ScraperApi usually proxies a GET request.
            const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(`Servidor ${matricula} ${city} ${state}`)}`;
            const scraperResponse = await axios.get(`http://api.scraperapi.com`, {
                params: {
                    api_key: SCRAPERAPI_KEY,
                    url: targetUrl
                }
            });

            searchContext = formatContext(scraperResponse.data, 'ScraperApi (Google Proxy)');
        }

        // --- GEMINI ANALYSIS (IF NOT GROUNDING) ---
        if (selectedProvider !== 'google_grounding') {
            if (!searchContext) throw new Error('Provedor não retornou dados úteis.');

            const analysisPrompt = `
                Atue como especialista OSINT. Analise os DADOS BRUTOS abaixo coletados via ${selectedProvider}.
                ALVO: ${matricula} - ${city}/${state} - ${target_name || ''}
                
                DADOS BRUTOS:
                ${searchContext}
                
                Gere um relatório em Markdown com:
                1. Identificação Confirmada (se houver).
                2. Vínculos e Cargos.
                3. Links e Fontes encontradas.
                Se os dados não forem suficientes, diga claramente.
            `;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: analysisPrompt }] }] },
                { headers: { 'Content-Type': 'application/json' } }
            );
            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (!aiResponse) throw new Error('Falha ao gerar relatório com a IA.');

        // Save to DB
        db.run(
            `INSERT INTO osint_searches (user_id, target_name, target_id, city, state, report_content) VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, target_name || 'Desconhecido', matricula, city, state, aiResponse],
            function (err) {
                if (err) console.error("Erro ao salvar histórico:", err);
            }
        );

        res.json({ success: true, report: aiResponse, provider: selectedProvider });

    } catch (error) {
        const upstreamError = error.response?.data?.error || error.response?.data || error.message;
        console.error('[OSINT ERROR FULL]', JSON.stringify(upstreamError, null, 2));

        res.status(500).json({
            error: 'Erro na busca OSINT.',
            details: JSON.stringify(upstreamError)
        });
    }
});

module.exports = router;
