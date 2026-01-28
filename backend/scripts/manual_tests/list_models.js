const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.models) {
                console.log("✅ Available Models:");
                parsedData.models.forEach(model => {
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                        console.log(`- ${model.name}`);
                    }
                });
            } else {
                console.log("❌ No models found or error:", parsedData);
            }
        } catch (e) {
            console.error("Error parsing response:", e.message);
        }
    });

}).on("error", (err) => {
    console.error("Error: " + err.message);
});
