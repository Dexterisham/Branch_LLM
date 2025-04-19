import express from 'express';
import cors from 'cors';
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize chat components
const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history"
});

const llm = new ChatOllama({
    model: "mistral",
    baseUrl: "http://localhost:11434"
});

const chain = new ConversationChain({ llm, memory });

// Chat endpoint
app.post("/api/generate", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const result = await chain.call({ input: message });
        res.json({ response: result.response });
    } catch (error) {
        console.error("Error processing chat:", error);
        res.status(500).json({ error: "Failed to process chat" });
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Make sure Ollama is running on http://localhost:11434");
}); 