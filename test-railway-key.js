// TEST SCRIPT - VALIDATE RAILWAY API KEY
// Run this to test the EXACT key Railway is using
const axios = require('axios');

// Get from Railway environment
const RAILWAY_API_KEY = process.env.GEMINI_API_KEY;

console.log("╔══════════════════════════════════════════════╗");
console.log("║   TESTE DE CHAVE DO RAILWAY                  ║");
console.log("╚══════════════════════════════════════════════╝\n");

if (!RAILWAY_API_KEY) {
    console.log("❌ VARIÁVEL GEMINI_API_KEY NÃO ESTÁ DEFINIDA NO AMBIENTE!");
    console.log("\nIsso significa que o Railway NÃO tem a variável configurada.");
    console.log("\nSOLUÇÃO:");
    console.log("1. Acesse Railway > Seu Projeto > Variables");
    console.log("2. Adicione: GEMINI_API_KEY = (sua chave paga)");
    console.log("3. Aguarde redeploy automático");
    process.exit(1);
}

console.log("✅ Variável encontrada!");
console.log(`Chave: ${RAILWAY_API_KEY.substring(0, 10)}...${RAILWAY_API_KEY.substring(RAILWAY_API_KEY.length - 5)}\n`);

async function testKey() {
    try {
        console.log("📡 Testando conexão com Gemini API...\n");

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${RAILWAY_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: "Responda apenas 'FUNCIONANDO' se você está operacional." }]
                }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("✅ ✅ ✅ CHAVE VÁLIDA! GEMINI RESPONDEU:");
        console.log(aiResponse);
        console.log("\n🎯 A chave está funcionando corretamente.");
        console.log("Se o OSINT ainda não funciona, o problema é outro (não a chave).\n");

    } catch (error) {
        console.log("❌ ❌ ❌ ERRO AO USAR A CHAVE\n");

        if (error.response?.data?.error) {
            const err = error.response.data.error;
            console.log("Código de erro:", err.code);
            console.log("Mensagem:", err.message);
            console.log("Status:", err.status);
            console.log("\nDetalhes completos:");
            console.log(JSON.stringify(err, null, 2));

            if (err.message.includes('API key expired')) {
                console.log("\n🔴 PROBLEMA: Chave expirada mesmo sendo paga!");
                console.log("Possível causa: Chave revogada ou projeto Google desabilitado");
            } else if (err.message.includes('API_KEY_INVALID')) {
                console.log("\n🔴 PROBLEMA: Chave inválida!");
                console.log("Verifique se copiou a chave completa sem espaços");
            } else if (err.code === 403) {
                console.log("\n🔴 PROBLEMA: API não habilitada no projeto");
                console.log("Solução: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
            }
        } else {
            console.log("Erro de rede ou outro:", error.message);
        }
    }
}

testKey();
