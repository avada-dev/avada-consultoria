const express = require('express');
const router = express.Router();

// Gemini API Key
const GEMINI_API_KEY = "AIzaSyCDcLLQol77KpeOqpa3U0lmfwc1uHUHdAY";

// Proxy endpoint for Gemini API to avoid CORS issues
router.post('/gemini-search', async (req, res) => {
    try {
        const { prompt, expectJson } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt é obrigatório' });
        }

        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        if (expectJson) {
            payload.generationConfig = { responseMimeType: "application/json" };
        } else {
            payload.tools = [{ "google_search": {} }];
        }

        // Usando axios que já está no projeto
        const axios = require('axios');
        const response = await axios.post(apiURL, payload, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: status => status < 500 // Resolve promessa para 4xx
        });

        if (response.status !== 200) {
            console.error('Erro Gemini API:', response.data);
            return res.status(response.status).json({
                error: 'Erro na API Gemini',
                details: response.data
            });
        }

        const data = response.data;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(500).json({ error: 'Resposta vazia da IA' });
        }

        if (expectJson) {
            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            try {
                return res.json({ result: JSON.parse(cleanJson) });
            } catch (e) {
                console.error("Erro parsing JSON:", e);
                return res.json({ result: {} }); // Retorna vazio se falhar parse
            }
        }

        res.json({ result: text });

    } catch (error) {
        console.error('Erro no proxy Gemini:', error);
        res.status(500).json({
            error: 'Erro ao processar requisição',
            message: error.message
        });
    }
});

module.exports = router;
