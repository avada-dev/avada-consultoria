// LOCAL TEST FOR OSINT FUNCTIONALITY
const axios = require('axios');

// Test configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyA_8lnHira2KHhMIF_1Nmthb2qBWErdSRk";
const testData = {
    matricula: "142812-8",
    city: "São Paulo",
    state: "SP",
    target_name: "",
    provider: "google_grounding"
};

async function testOSINT() {
    console.log("=== TESTING OSINT FUNCTIONALITY ===");
    console.log("API Key:", GEMINI_API_KEY ? "SET" : "NOT SET");
    console.log("Test Data:", testData);
    console.log("");

    try {
        // Format matricula variations
        const matriculaClean = testData.matricula.replace(/[-\s]/g, '');
        const matriculaVariations = [
            testData.matricula,
            matriculaClean,
            matriculaClean.replace(/(\d{6})(\d)/, '$1-$2'),
        ].filter((v, i, a) => a.indexOf(v) === i).join(' OR ');

        const prompt = `
Busque informações EXCLUSIVAMENTE sobre o servidor público com a matrícula ${testData.matricula}.
Cidade: ${testData.city}, Estado: ${testData.state}.
Nome: ${testData.target_name || "não informado"}.

INSTRUÇÕES CRÍTICAS:
1. Use Google Search para encontrar dados públicos
2. Busque APENAS por matrícula: ${matriculaVariations}
3. Procure em: Portal da Transparência, Diários Oficiais, sites .gov.br
4. Se NÃO encontrar dados desta matrícula específica, retorne "Nenhum dado encontrado"
5. NÃO invente dados

FORMATO DA RESPOSTA (Markdown):
# Servidor Público - Matrícula ${testData.matricula}

## 1. Identificação
- Nome:
- Cargo:
- Órgão:

## 2. Vínculos e Remuneração
[dados do portal da transparência]

## 3. Publicações em Diários Oficiais
[lista de menções encontradas]

## 4. Fontes
[links das fontes consultadas]
        `.trim();

        console.log("=== PROMPT BEING SENT ===");
        console.log(prompt);
        console.log("\n=== CALLING GEMINI API ===\n");

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
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log("=== SUCCESS ===");
        const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("AI Response:");
        console.log(aiResponse || "NO RESPONSE TEXT");

    } catch (error) {
        console.log("=== ERROR DETECTED ===");
        console.log("Error Type:", error.constructor.name);
        console.log("Error Message:", error.message);

        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Response Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("Full Error:", error);
        }
    }
}

testOSINT();
