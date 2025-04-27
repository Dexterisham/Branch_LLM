import express from "express";
import cors from "cors";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const app = express();
app.use(cors());
app.use(express.json());

const llm = new ChatOllama({
  model: "mistral",
  baseUrl: "http://localhost:11434"
});

// Store conversation history in memory (would be database in production)
const conversations = new Map();

app.post("/chat", async (req, res) => {
  try {
    const { message, conversationId = "default" } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Get or create conversation history
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, []);
    }
    const history = conversations.get(conversationId);
    
    // Add the new message to history
    const humanMessage = new HumanMessage(message);
    history.push(humanMessage);
    
    console.log("Full conversation history:");
    history.forEach((msg, i) => {
      console.log(`${i}: ${msg._getType()}: ${msg.content}`);
    });
    
    // Prepare the full conversation for the LLM
    const response = await llm.invoke(history);
    
    // Add the AI's response to history
    history.push(response);
    
    res.json({ 
      response: response.content,
      conversationId,
      historyLength: history.length
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});