import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { json } from '@sveltejs/kit';

const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history"
});

let llm;
try {
    llm = new ChatOllama({
        model: "mistral",
        baseUrl: "http://localhost:11434"
    });
} catch (error) {
    console.error("Failed to initialize Ollama:", error);
}

const chain = new ConversationChain({ llm, memory });

export async function POST({ request }) {
    try {
        const body = await request.json();
        const input = body.message;
        
        if (!input) {
            return json({ error: "Message is required" }, { status: 400 });
        }

        console.log("Received message:", input);
        
        try {
            const result = await chain.call({ input });
            console.log("Response generated successfully");
            return json({ response: result.response });
        } catch (error) {
            console.error("Ollama processing error:", error);
            return json({ 
                error: "Failed to process with Ollama",
                details: error.message 
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Server error:", error);
        return json({ 
            error: "Internal server error",
            details: error.message 
        }, { status: 500 });
    }
} 