const { ChatMistralAI } = require("@langchain/mistralai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

// Initialize LangChain Mistral Chat Model
// Initialize LangChain Mistral Chat Model inside handler or lazily to ensure env vars are loaded
const getModel = () => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
        throw new Error("MISTRAL_API_KEY is missing in environment variables");
    }
    return new ChatMistralAI({
        model: "mistral-small-latest",
        apiKey: apiKey,
        maxRetries: 0,
    });
};

const askGemini = async (req, res) => {
    try {
        const { query, context, mode } = req.body;

        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        let template = "";

        if (mode === "student_doubt") {
            template = `You are a helpful and encouraging AI tutor for students (Class 6).
            Use simple language. Explain concepts clearly.
            If context is provided, use it to answer the question but you can expound on it.
            
            Context: {context}
            
            User Question: {query}`;
        } else if (mode === "app_help") {
            template = `You are a support assistant for the EduGames app.
             Help users navigate the app, understand features (Games, Profile, Teacher Dashboard, Offline Mode), and troubleshoot.
             Refuse to answer non-app related questions.
             Use the provided context to give specific instructions (e.g., "Go to the Games tab...").
             
             Context: {context}
             
             User Question: {query}`;
        } else {
            template = `You are a helpful assistant.
            Context: {context}
            
            User Question: {query}`;
        }

        const model = getModel();
        const prompt = PromptTemplate.fromTemplate(template);
        const outputParser = new StringOutputParser();
        const chain = prompt.pipe(model).pipe(outputParser);

        const contextString = context ? JSON.stringify(context) : "No context provided";
        const answer = await chain.invoke({
            context: contextString,
            query: query
        });

        res.json({ answer: answer });
    } catch (error) {
        console.error("AI Error:", error);
        // Forward status code if available (e.g. from axios/fetch calls within LangChain), otherwise 500
        const status = error.response?.status || error.status || 500;
        res.status(status).json({
            answer: "I'm having trouble connecting to my brain right now.",
            error: error.message
        });
    }
};

module.exports = {
    askGemini
};
