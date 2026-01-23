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

// DIAGNOSTIC ENDPOINT
router.get('/diagnostic', (req, res) => {
    const keys = getApiKeys();

    // Lista apenas chaves relevantes de forma segura
    const allEnvKeys = Object.keys(process.env).filter(k =>
        k.includes('API') || k.includes('KEY') || k.includes('SERP') || k.includes('TAVILY') || k.includes('SCRAPER')
    );

    const envSnapshot = {};
    allEnvKeys.forEach(key => {
        const val = process.env[key];
        envSnapshot[key] = val ? 'CONFIGURADA (OK)' : 'VAZIA';
    });

    res.json({
        STATUS_VARIAVEIS: envSnapshot,
        APIS_ATIVAS: {
            GEMINI: !!keys.GEMINI_API_KEY,
            TAVILY: !!keys.TAVILY_API_KEY,
            SERPAPI: !!keys.SERPAPI_KEY,
            SCRAPER: !!keys.SCRAPERAPI_KEY
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

// Helper: Variations of matricula
function generateMatriculaVariations(matricula) {
    const clean = matricula.replace(/[^\d]/g, '');
    const variations = new Set([
        matricula,
        clean,
        clean.replace(/(\d{6})(\d)/, '$1-$2'), // Formato 123456-7
        clean.replace(/(\d{3})(\d{3})(\d)/, '$1.$2-$3') // Formato 123.456-7
    ]);
    return Array.from(variations).filter(v => v.length > 0);
}

// Helper: Prompt COM RESTRIÇÃO GEOGRÁFICA RÍGIDA
function buildServiderPublicoPrompt(matricula, city, state, target_name) {
    const variations = generateMatriculaVariations(matricula);

    return `
Você é um assistente estritamente técnico de análise de documentos.

**MISSÃO**: Analisar os resultados brutos da pesquisa (fornecidos abaixo na seção DADOS) e extrair SOMENTE informações desta matrícula específica nesta localidade específica.

**ALVO EXATO**:
- Matrícula: ${matricula} (variações aceitas: ${variations.join(', ')})
- Localidade OBRIGATÓRIA: ${city} / ${state}
- Nome (opcional): ${target_name || 'N/A'}

**REGRAS DE FILTRAGEM RÍGIDA (MANDATÓRIO)**:
1. **IGNORE TOTALMENTE** qualquer resultado que seja de outra Cidade ou outro Estado.
   - Exemplo: Se busco "São Paulo/SP" e aparece "Rio de Janeiro", DESCARTE IMEDIATAMENTE.
2. **IGNORE** resultados que não contenham a matrícula (ou variações).
3. **VALIDAÇÃO**: O documento deve citar explicitamente a cidade de "${city}" ou o estado "${state}" junto com a matrícula.

**INSTRUÇÕES DE RELATÓRIO**:
- Liste apenas os documentos positivos e confirmados.
- Copie o trecho exato onde a informação aparece.
- Se a informação vier de um Diário Oficial, procure por "nomeação", "exoneração", "portaria", "gratificação".
- Se vier de Portal da Transparência, extraia cargo e lotação.

**FORMATO DE SAÍDA (MARKDOWN)**:

Se encontrar resultados VÁLIDOS em ${city}/${state}:

### ✅ Documentos Encontrados em ${city}-${state}

**1. [Título do Documento ou Site]**
- **Fonte**: [Nome do Site/Portal]
- **Trecho Encontrado**: "...[citar trecho exato]..."
- **Detalhes**: [Resumo do que se trata: nomeação, folha de pagamento, etc]
- **Link**: [URL original]

(Repetir para cada resultado válido)

---
**Conclusão**: [Resumo final]

---------------------------------------------------------
Se NÃO encontrar resultados VÁLIDOS em ${city}/${state}:

### ❌ Nenhum documento localizado
Não foram encontradas referências públicas para a matrícula **${matricula}** especificamente na cidade de **${city}-${state}**.
(Se houver resultados descartados de outros locais, mencionar apenas: "Nota: Foram ignorados resultados de outros municípios/estados.")
`.trim();
}

// Helper: Format Context
function formatContext(results, provider) {
    if (!results) return "Nenhum resultado bruto retornado pela API.";
    return `DADOS BRUTOS DA API (${provider}):\n\n${JSON.stringify(results, null, 2).substring(0, 50000)}`;
}

// POST Search
router.post('/search', async (req, res) => {
    const { matricula, city, state, target_name, provider } = req.body;
    const keys = getApiKeys();

    console.log(`[OSINT] Nova busca iniciada: ${matricula} em ${city}/${state} via ${provider}`);

    if (!matricula || !city || !state) {
        return res.status(400).json({ error: 'Informe Matrícula, Cidade e Estado.' });
    }

    if (!keys.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Erro interno: Chave de processamento não configurada (GEMINI_API).' });
    }

    const selectedProvider = provider || 'serpapi'; // Padrão SerpApi se null

    // BLOQUEIO EXPLÍCITO DE GOOGLE GROUNDING/GEMINI SEARCH
    if (selectedProvider === 'google_grounding') {
        return res.status(400).json({ error: 'Busca via Gemini/Google Grounding está DESATIVADA. Use APIS: serpapi, tavily ou scraperapi.' });
    }

    let searchContext = "";
    let aiResponse = "";
    let finalQuery = "";

    try {
        const prompt = buildServiderPublicoPrompt(matricula, city, state, target_name);

        // --- TAVILY API ---
        if (selectedProvider === 'tavily') {
            if (!keys.TAVILY_API_KEY) {
                return res.status(500).json({ error: 'API Key da Tavily não configurada no servidor.' });
            }

            // QUERY ESPECÍFICA (Matrícula + Cidade + Estado)
            // Aspas forçam termos exatos
            finalQuery = `"${matricula}" "${city}" "${state}" (servidor OR funcionário OR lotação OR portaria)`;
            console.log('[OSINT] Executando Tavily:', finalQuery);

            const tavilyResponse = await axios.post(
                'https://api.tavily.com/search',
                {
                    api_key: keys.TAVILY_API_KEY,
                    query: finalQuery,
                    search_depth: 'advanced',
                    include_answer: false, // Não queremos resumo da IA deles, queremos dados brutos
                    max_results: 15
                },
                { timeout: 45000 }
            );

            searchContext = formatContext(tavilyResponse.data, 'Tavily');

            // --- SERPAPI ---
        } else if (selectedProvider === 'serpapi') {
            if (!keys.SERPAPI_KEY) {
                return res.status(500).json({ error: 'API Key do SerpApi não configurada no servidor.' });
            }

            // QUERY ESPECÍFICA NO GOOGLE
            finalQuery = `"${matricula}" "${city}" "${state}" -"outras cidades"`;
            console.log('[OSINT] Executando SerpApi:', finalQuery);

            const serpApiResponse = await axios.get('https://serpapi.com/search', {
                params: {
                    api_key: keys.SERPAPI_KEY,
                    q: finalQuery,
                    engine: 'google',
                    gl: 'br', // Brasil
                    hl: 'pt', // Português
                    num: 20
                },
                timeout: 45000
            });

            searchContext = formatContext(serpApiResponse.data.organic_results, 'SerpApi');

            // --- SCRAPERAPI ---
        } else if (selectedProvider === 'scraperapi') {
            if (!keys.SCRAPERAPI_KEY) {
                return res.status(500).json({ error: 'API Key do ScraperApi não configurada no servidor.' });
            }

            // QUERY ESPECÍFICA
            finalQuery = `"${matricula}" "${city}" "${state}"`;
            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}&num=20&hl=pt-BR`;
            console.log('[OSINT] Executando ScraperApi:', googleSearchUrl);

            const scraperResponse = await axios.get('https://api.scraperapi.com', {
                params: {
                    api_key: keys.SCRAPERAPI_KEY,
                    url: googleSearchUrl,
                    country_code: 'br'
                },
                timeout: 60000
            });

            // Limita tamanho para não estourar contexto
            searchContext = `HTML Bruto (ScraperApi):\n${scraperResponse.data.substring(0, 40000)}`;

        } else {
            return res.status(400).json({ error: 'Provedor desconhecido.' });
        }

        // PROCESSAMENTO DE LEITURA (GEMINI LÊ O JSON/HTML, NÃO PESQUISA)
        // O usuário quer um relatório legível dos dados brutos
        console.log('[OSINT] Processando dados brutos para relatório...');

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: `${prompt}\n\n${searchContext}` }] }]
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );

        aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            throw new Error('Falha ao gerar relatório de leitura.');
        }

        // Salvar Histórico
        db.run(
            'INSERT INTO osint_searches (user_id, target_name, target_id, city, state, notes, report_content) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, target_name || 'N/A', matricula, city, state, `Provedor: ${selectedProvider} | Query: ${finalQuery}`, aiResponse],
            (err) => { if (err) console.error('[OSINT] Erro ao salvar histórico:', err.message); }
        );

        console.log('[OSINT] Busca concluída com sucesso.');
        res.json({ report: aiResponse });

    } catch (error) {
        console.error('[OSINT] ERRO:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.error?.message || error.message;
        res.status(500).json({ error: 'Erro na execução da busca.', details: errorMsg, provider: selectedProvider });
    }
});

module.exports = router;
