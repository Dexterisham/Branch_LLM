// place files you want to import through the `$lib` alias in this folder.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "chat_history"
});

// Initialize Ollama client with error handling
let llm;
try {
  llm = new ChatOllama({
    model: "mistral",
    baseUrl: "http://localhost:11434"
  });
} catch (error) {
  console.error("Failed to initialize Ollama:", error);
  process.exit(1);
}

const chain = new ConversationChain({ llm, memory });

app.post("/chat", async (req, res) => {
  try {
    const input = req.body.message;
    
    if (!input) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Received message:", input);
    
    // Check if Ollama is accessible
    try {
      const result = await chain.call({ input });
      console.log("Response generated successfully");
      res.json({ response: result.response });
    } catch (error) {
      console.error("Ollama processing error:", error);
      res.status(500).json({ 
        error: "Failed to process with Ollama",
        details: error.message 
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
});

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", ollamaUrl: "http://localhost:11434" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LangChain server running at http://localhost:${PORT}`);
  console.log("Make sure Ollama is running at http://localhost:11434");
});
