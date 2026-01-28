const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
require('dotenv').config();

async function testLangChain() {
    try {
        console.log("Initializing Model...", process.env.GEMINI_API_KEY ? "API Key Present" : "API Key Missing");

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash",
            apiKey: process.env.GEMINI_API_KEY,
            maxOutputTokens: 2048,
            maxRetries: 0,
        });

        const template = `Answer the question: {question}`;
        const prompt = PromptTemplate.fromTemplate(template);
        const outputParser = new StringOutputParser();
        const chain = prompt.pipe(model).pipe(outputParser);

        console.log("Sending query...");
        const answer = await chain.invoke({
            question: "What is the capital of India?"
        });

        console.log("Response:", answer);
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testLangChain();
