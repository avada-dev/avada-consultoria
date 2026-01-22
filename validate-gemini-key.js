// SCRIPT DE VALIDAÇÃO DE CHAVE GEMINI
// Execute: node validate-gemini-key.js

const axios = require('axios');

const KEY_TO_TEST = process.env.GEMINI_API_KEY || "COLE_SUA_CHAVE_AQUI";

async function validateKey() {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║   VALIDADOR DE CHAVE GEMINI API              ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    if (KEY_TO_TEST === "COLE_SUA_CHAVE_AQUI") {
        console.log("❌ ERRO: Defina a chave no código ou via GEMINI_API_KEY");
        console.log("\nExemplo:");
        console.log("  Windows: set GEMINI_API_KEY=sua_chave_aqui && node validate-gemini-key.js");
        console.log("  Linux:   GEMINI_API_KEY=sua_chave_aqui node validate-gemini-key.js");
        return;
    }

    console.log(`🔑 Testando chave: ${KEY_TO_TEST.substring(0, 15)}...${KEY_TO_TEST.substring(KEY_TO_TEST.length - 5)}\n`);

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY_TO_TEST}`,
            {
                contents: [{
                    parts: [{ text: "Responda apenas 'OK' se você está funcionando." }]
                }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("✅ CHAVE VÁLIDA E FUNCIONANDO!\n");
        console.log("Resposta do Gemini:", aiResponse);
        console.log("\n📋 PRÓXIMOS PASSOS:");
        console.log("1. Acesse Railway.app");
        console.log("2. Vá em Variables");
        console.log("3. Adicione/Edite: GEMINI_API_KEY = " + KEY_TO_TEST);
        console.log("4. Aguarde o redeploy automático (2-3 min)");
        console.log("5. Teste a ferramenta OSINT no CRM\n");

    } catch (error) {
        console.log("❌ ERRO AO VALIDAR CHAVE\n");

        if (error.response?.data?.error) {
            const err = error.response.data.error;
            console.log("Código:", err.code);
            console.log("Mensagem:", err.message);
            console.log("Status:", err.status);

            if (err.message.includes('API key expired') || err.message.includes('API_KEY_INVALID')) {
                console.log("\n🔴 DIAGNÓSTICO: CHAVE EXPIRADA OU INVÁLIDA");
                console.log("\n💡 SOLUÇÃO:");
                console.log("1. Acesse: https://aistudio.google.com/app/apikey");
                console.log("2. Crie uma NOVA chave");
                console.log("3. Teste novamente com este script");
            } else if (err.message.includes('429')) {
                console.log("\n⚠️ DIAGNÓSTICO: LIMITE DE REQUISIÇÕES EXCEDIDO");
                console.log("Aguarde alguns minutos e tente novamente.");
            }
        } else {
            console.log("Erro completo:", error.message);
        }
    }
}

validateKey();
