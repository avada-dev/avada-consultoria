const axios = require('axios');

const GEMINI_API_KEY = "AIzaSyA_8lnHira2KHhMIF_1Nmthb2qBWErdSRk";

// Using 1.5 Flash as in the routes file (suspect)
const MODEL_NAME = "gemini-1.5-flash";
// const MODEL_NAME = "gemini-2.0-flash-exp"; // Option B

async function testOsintCall() {
    console.log("=== DEBUG OSINT START ===");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = "Teste, quem é o atual presidente do Brasil?";

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.3 } } }]
    };

    console.log(`URL: ${url}`);
    console.log(`Body:`, JSON.stringify(requestBody, null, 2));

    try {
        const response = await axios.post(url, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("✅ SUCCESS!");
        console.log("Response:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log("❌ ERROR!");
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("Message:", error.message);
        }
    }
}

testOsintCall();
