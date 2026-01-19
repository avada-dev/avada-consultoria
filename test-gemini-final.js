const axios = require('axios');

// NOVA CHAVE FORNECIDA PELO USUÁRIO
const API_KEY = "AIzaSyA_8lnHira2KHhMIF_1Nmthb2qBWErdSRk";

async function testModel(modelName) {
    console.log(`\n================================`);
    console.log(`Testing model: ${modelName}`);
    console.log(`================================`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello, confirm you are working." }] }]
        }, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: null
        });

        console.log(`STATUS CODE: ${response.status}`);

        if (response.status === 200) {
            console.log("✅ SUCESSO! O modelo funciona.");
            console.log("Resposta:", response.data.candidates[0].content.parts[0].text);
        } else {
            console.log("❌ ERRO! O modelo falhou.");
            console.log("Detalhes do Erro:", JSON.stringify(response.data, null, 2));
        }
    } catch (error) {
        console.error("Erro fatal de rede:", error.message);
    }
}

async function runTests() {
    // Teste 1: O modelo que o usuário exige
    await testModel('gemini-2.5-flash');

    // Teste 2: O modelo que sabemos que existe (para comparação)
    await testModel('gemini-1.5-flash');
}

runTests();
