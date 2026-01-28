const { ChatMistralAI } = require("@langchain/mistralai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
require('dotenv').config();

async function testMistral() {
    try {
        console.log("Initializing Mistral Model...");

        const model = new ChatMistralAI({
            model: "mistral-small-latest",
            apiKey: process.env.MISTRAL_API_KEY,
        });

        const template = `Answer the question: {question}`;
        const prompt = PromptTemplate.fromTemplate(template);
        const outputParser = new StringOutputParser();
        const chain = prompt.pipe(model).pipe(outputParser);

        console.log("Sending query to Mistral...");
        const answer = await chain.invoke({
            question: "What is the capital of France?"
        });

        console.log("Mistral Response:", answer);
    } catch (error) {
        console.error("Mistral Test Failed:", error);
    }
}

testMistral();
