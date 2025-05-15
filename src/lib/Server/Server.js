import express from 'express';
import cors from 'cors';
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";

class BranchManager {
    constructor() {
        this.branches = new Map();
        this.llm = new ChatOllama({
            model: "mistral",
            baseUrl: "http://localhost:11434"
        });
    }

    createBranch(branchId, parentBranchId = null) {
        console.log(`Creating new branch: ${branchId}`);
        
        const memory = new BufferMemory({
            returnMessages: true,
            memoryKey: "history",
            inputKey: "input",
            outputKey: "response"
        });

        const prompt = PromptTemplate.fromTemplate(
            `The following is a conversation between a human and an AI assistant.

Current conversation:
{history}

Human: {input}
AI:`
        );

        const chain = new ConversationChain({
            llm: this.llm,
            memory: memory,
            prompt: prompt,
            verbose: true
        });

        if (parentBranchId && this.branches.has(parentBranchId)) {
            console.log(`Copying history from parent branch: ${parentBranchId}`);
            const parentBranch = this.branches.get(parentBranchId);
            const parentMessages = parentBranch.memory.chatHistory.messages;
            parentMessages.forEach(message => {
                memory.chatHistory.addMessage(message);
            });
        }

        this.branches.set(branchId, {
            chain,
            memory,
            createdAt: new Date()
        });

        return { success: true, branchId };
    }

    async sendMessage(branchId, message) {
        if (!this.branches.has(branchId)) {
            throw new Error(`Branch ${branchId} not found`);
        }

        console.log(`Sending message to branch ${branchId}: ${message}`);
        const branch = this.branches.get(branchId);
        
        try {
            const result = await branch.chain.call({ input: message });
            return {
                success: true,
                response: result.response
            };
        } catch (error) {
            console.error("Error processing message:", error);
            throw error;
        }
    }

    getBranchHistory(branchId) {
        if (!this.branches.has(branchId)) {
            throw new Error(`Branch ${branchId} not found`);
        }

        const branch = this.branches.get(branchId);
        return {
            success: true,
            history: branch.memory.chatHistory.messages
        };
    }
}

const app = express();
const branchManager = new BranchManager();

app.use(cors());
app.use(express.json());

// Create a new branch
app.post('/api/branch', (req, res) => {
    try {
        const { branchId, parentBranchId } = req.body;
        const result = branchManager.createBranch(branchId, parentBranchId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send message to a branch
app.post('/api/branch/message', async (req, res) => {
    try {
        const { branchId, message } = req.body;
        const result = await branchManager.sendMessage(branchId, message);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get branch history
app.get('/api/branch/:branchId/history', (req, res) => {
    try {
        const { branchId } = req.params;
        const result = branchManager.getBranchHistory(branchId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 