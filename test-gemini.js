const axios = require('axios');

const API_KEY = "AIzaSyCDcLLQol77KpeOqpa3U0lmfwc1uHUHdAY";

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello, are you working?" }] }]
        }, {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: null // Capture all status codes
        });

        console.log(`Status: ${response.status}`);
        if (response.status === 200) {
            console.log("Success!");
        } else {
            console.log("Error Response:", JSON.stringify(response.data, null, 2));
        }
    } catch (error) {
        console.error("Network/Client Error:", error.message);
    }
}

async function runTests() {
    await testModel('gemini-1.5-flash');
    await testModel('gemini-2.0-flash-exp');
    await testModel('gemini-2.5-flash');
}

runTests();
