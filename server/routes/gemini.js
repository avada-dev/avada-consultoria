const express = require('express');
const router = express.Router();

// Gemini API Key
const GEMINI_API_KEY = "AIzaSyCDcLLQol77KpeOqpa3U0lmfwc1uHUHdAY";

// Proxy endpoint for Gemini API to avoid CORS issues
router.post('/gemini-search', async (req, res) => {
    console.log('[GEMINI] ===== Nova Requisição =====');
    console.log('[GEMINI] Timestamp:', new Date().toISOString());
    console.log('[GEMINI] Prompt length:', req.body?.prompt?.length || 0);
    console.log('[GEMINI] expectJson:', req.body?.expectJson);

    try {
        const { prompt, expectJson } = req.body;

        if (!prompt) {
            console.log('[GEMINI] Erro: Prompt vazio');
            return res.status(400).json({ error: 'Prompt é obrigatório' });
        }

        // MODELO ATUALIZADO: gemini-2.5-flash (estável)
        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        console.log('[GEMINI] Modelo: gemini-2.5-flash');

        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        if (expectJson) {
            payload.generationConfig = { responseMimeType: "application/json" };
            console.log('[GEMINI] Modo: JSON response');
        } else {
            payload.tools = [{ "google_search": {} }];
            console.log('[GEMINI] Modo: Google Search habilitado');
        }

        // Usando axios que já está no projeto
        const axios = require('axios');
        console.log('[GEMINI] Iniciando chamada à API...');

        const response = await axios.post(apiURL, payload, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: status => status < 500, // Resolve promessa para 4xx
            timeout: 30000 // 30 segundos timeout
        });

        console.log('[GEMINI] Resposta recebida - Status:', response.status);

        if (response.status !== 200) {
            console.error('[GEMINI] Erro da API - Status:', response.status);
            console.error('[GEMINI] Erro da API - Data:', JSON.stringify(response.data));
            return res.status(response.status).json({
                error: 'Erro na API Gemini',
                details: response.data
            });
        }

        const data = response.data;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('[GEMINI] Resposta vazia da IA');
            return res.status(500).json({ error: 'Resposta vazia da IA' });
        }

        console.log('[GEMINI] Texto recebido - length:', text.length);

        if (expectJson) {
            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            try {
                const parsed = JSON.parse(cleanJson);
                console.log('[GEMINI] JSON parseado com sucesso');
                return res.json({ result: parsed });
            } catch (e) {
                console.error('[GEMINI] Erro ao parsear JSON:', e.message);
                return res.json({ result: {} }); // Retorna vazio se falhar parse
            }
        }

        console.log('[GEMINI] Enviando resposta texto');
        res.json({ result: text });

    } catch (error) {
        console.error('[GEMINI ERROR] ===== ERRO =====');
        console.error('[GEMINI ERROR] Tipo:', error.code);
        console.error('[GEMINI ERROR] Mensagem:', error.message);
        console.error('[GEMINI ERROR] Stack:', error.stack);

        res.status(500).json({
            error: 'Erro ao processar requisição',
            message: error.message,
            code: error.code
        });
    }
});

module.exports = router;
