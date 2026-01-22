const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');

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

// Helper: Generate matricula variations
function generateMatriculaVariations(matricula) {
    const clean = matricula.replace(/[-\s]/g, '');
    const variations = new Set([
        matricula.trim(),
        clean,
        // Try common patterns
        clean.replace(/(\d{6})(\d)/, '$1-$2'),
        clean.replace(/(\d{3})(\d{3})(\d)/, '$1.$2-$3'),
        clean.replace(/(\d{3})(\d{3})(\d)/, '$1-$2-$3'),
    ]);
    return Array.from(variations).filter(v => v.length > 0);
}

// Helper: Build servidor público specific prompt
function buildServiderPublicoPrompt(matricula, city, state, target_name) {
    const variations = generateMatriculaVariations(matricula);

    return `
Você é um especialista em OSINT para auditoria pública brasileira.

MISSÃO CRÍTICA: Buscar informações EXCLUSIVAMENTE sobre o servidor público identificado pela matrícula "${matricula}".

DADOS DO ALVO:
- Matrícula: ${matricula} (variações: ${variations.join(', ')})
- Nome: ${target_name || 'não informado'}
- Local de atuação: ${city} - ${state}

INSTRUÇÕES OBRIGATÓRIAS:
1. Use Google Search para buscar APENAS esta matrícula específica
2. Busque em fontes oficiais: Portal da Transparência, Diários Oficiais (.gov.br), TCE/TCM
3. Combine matrícula + cidade + estado nas buscas
4. Se NÃO encontrar dados desta matrícula, retorne "Nenhum dado encontrado para esta matrícula"
5. NÃO invente dados. Use APENAS informações verificáveis nas fontes
6. Inclua SEMPRE os links das fontes consultadas

FORMATO DA RESPOSTA (Markdown estrito):

# Servidor Público - Matrícula ${matricula}

## ✅ Status da Busca
[Encontrado / Nenhum dado encontrado]

## 1. Identificação Confirmada
- **Nome Completo**: 
- **Cargo/Função**: 
- **Órgão/Secretaria**: 
- **Matrícula**: ${matricula}

## 2. Vínculos e Remuneração
[Dados do Portal da Transparência - salário, gratificações, etc]

## 3. Publicações em Diários Oficiais
[Lista de menções em DOs com datas e descrição]

## 4. Processos e Pendências
[Se houver processos administrativos ou judiciais]

## 5. Fontes Consultadas
- [Link 1]
- [Link 2]

---
**Importante**: Todos os dados acima são públicos e verificáveis nas fontes listadas.
`.trim();
}

// Helper: Format Context for external providers
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

    // Validate API Key before proceeding
    if (!GEMINI_API_KEY) {
        return res.status(500).json({
            error: 'Chave Gemini não configurada no servidor',
            details: 'A variável de ambiente GEMINI_API_KEY não está definida. Configure no Railway.'
        });
    }

    const selectedProvider = provider || 'google_grounding';
    console.log(`[OSINT] Busca via ${selectedProvider}: ${matricula} em ${city}/${state}`);

    let aiResponse = "";
    let searchContext = "";

    try {
        const prompt = buildServiderPublicoPrompt(matricula, city, state, target_name);

        // --- STRATEGY 1: NATIVE GOOGLE GROUNDING (RECOMMENDED) ---
        if (selectedProvider === 'google_grounding') {
            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{
                    google_search_retrieval: {
                        dynamic_retrieval_config: {
                            mode: "MODE_DYNAMIC",
                            dynamic_threshold: 0.3
                        }
                    }
                }]
            };

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                requestBody,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 60000
                }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

            // --- STRATEGY 2: TAVILY API ---
        } else if (selectedProvider === 'tavily') {
            if (!TAVILY_API_KEY) {
                return res.status(400).json({
                    error: 'Chave Tavily não configurada',
                    details: 'Defina TAVILY_API_KEY no Railway para usar este provedor'
                });
            }

            const variations = generateMatriculaVariations(matricula);
            const query = `servidor público matrícula (${variations.join(' OR ')}) ${city} ${state} site:.gov.br`;

            const tavilyResponse = await axios.post('https://api.tavily.com/search', {
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: "advanced",
                include_answer: true,
                max_results: 10
            });

            searchContext = formatContext(tavilyResponse.data, 'Tavily');

            // --- STRATEGY 3: SERPAPI ---
        } else if (selectedProvider === 'serpapi') {
            if (!SERPAPI_KEY) {
                return res.status(400).json({
                    error: 'Chave SerpApi não configurada',
                    details: 'Defina SERPAPI_KEY no Railway para usar este provedor'
                });
            }

            const variations = generateMatriculaVariations(matricula);
            const query = `(${variations.join(' OR ')}) servidor ${city} ${state} site:.gov.br`;

            const serpResponse = await axios.get(`https://serpapi.com/search`, {
                params: {
                    api_key: SERPAPI_KEY,
                    q: query,
                    location: "Brazil",
                    hl: "pt-br",
                    gl: "br",
                    num: 20
                }
            });

            searchContext = formatContext(serpResponse.data.organic_results, 'SerpApi');

            // --- STRATEGY 4: SCRAPERAPI ---
        } else if (selectedProvider === 'scraperapi') {
            if (!SCRAPERAPI_KEY) {
                return res.status(400).json({
                    error: 'Chave ScraperApi não configurada',
                    details: 'Defina SCRAPERAPI_KEY no Railway para usar este provedor'
                });
            }

            const variations = generateMatriculaVariations(matricula);
            const searchQuery = `servidor ${matricula} ${city} ${state}`;
            const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

            const scraperResponse = await axios.get(`http://api.scraperapi.com`, {
                params: {
                    api_key: SCRAPERAPI_KEY,
                    url: targetUrl
                },
                timeout: 30000
            });

            searchContext = `HTML da busca Google capturado. Tamanho: ${scraperResponse.data.length} caracteres`;
        }

        // --- GEMINI ANALYSIS (for external providers) ---
        if (selectedProvider !== 'google_grounding') {
            if (!searchContext) {
                return res.status(500).json({
                    error: 'Nenhum dado retornado pelo provedor',
                    details: `${selectedProvider} não retornou resultados`
                });
            }

            const analysisPrompt = `${prompt}\n\nDADOS BRUTOS COLETADOS:\n${searchContext}\n\nAnalise os dados acima e gere o relatório no formato solicitado.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: analysisPrompt }] }] },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 60000
                }
            );

            aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (!aiResponse) {
            return res.status(500).json({
                error: 'IA não retornou resposta',
                details: 'Gemini não gerou texto. Possível bloqueio de segurança ou timeout.'
            });
        }

        // Save to DB
        db.run(
            `INSERT INTO osint_searches (user_id, target_name, target_id, city, state, report_content) VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, target_name || 'Servidor Público', matricula, city, state, aiResponse],
            function (err) {
                if (err) console.error("[OSINT] Erro ao salvar histórico:", err);
            }
        );

        res.json({
            success: true,
            report: aiResponse,
            provider: selectedProvider,
            matricula_variations: generateMatriculaVariations(matricula)
        });

    } catch (error) {
        console.error('[OSINT ERROR FULL]', error.response?.data || error.message);

        // Handle specific error cases
        if (error.response?.data?.error) {
            const geminiError = error.response.data.error;

            if (geminiError.message?.includes('API key expired') || geminiError.message?.includes('API_KEY_INVALID')) {
                return res.status(401).json({
                    error: '🔑 CHAVE GEMINI EXPIRADA OU INVÁLIDA',
                    details: 'A chave configurada no Railway não é válida. Gere uma nova em: https://aistudio.google.com/app/apikey e atualize a variável GEMINI_API_KEY no Railway.'
                });
            }

            return res.status(500).json({
                error: 'Erro do provedor de IA',
                details: geminiError.message || JSON.stringify(geminiError)
            });
        }

        res.status(500).json({
            error: 'Erro na busca OSINT',
            details: error.message || 'Erro desconhecido'
        });
    }
});

module.exports = router;
