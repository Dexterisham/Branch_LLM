import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";

// Test class to manage branches
class BranchManager {
    constructor() {
        this.branches = new Map();
        this.llm = new ChatOllama({
            model: "mistral",
            baseUrl: "http://localhost:11434"
        });
    }

    // Create a new branch with isolated memory
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

        // If this is a child branch, copy parent's history
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

    // Send message to specific branch
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

    // Get branch history
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

// Test function
async function runTest() {
    const manager = new BranchManager();
    
    try {
        // Create first branch
        console.log("\n=== Creating Branch A ===");
        manager.createBranch("branch-a");
        
        // Send message to Branch A
        console.log("\n=== Testing Branch A ===");
        const responseA1 = await manager.sendMessage("branch-a", "Let's talk about space exploration.");
        console.log("Branch A Response 1:", responseA1);
        
        const responseA2 = await manager.sendMessage("branch-a", "What are the main challenges?");
        console.log("Branch A Response 2:", responseA2);
        
        // Create second branch from Branch A
        console.log("\n=== Creating Branch B from Branch A ===");
        manager.createBranch("branch-b", "branch-a");
        
        // Send message to Branch B (should have context from Branch A)
        console.log("\n=== Testing Branch B ===");
        const responseB1 = await manager.sendMessage("branch-b", "What about exploring Venus instead?");
        console.log("Branch B Response 1:", responseB1);
        
        // Create third branch (independent)
        console.log("\n=== Creating Branch C (Independent) ===");
        manager.createBranch("branch-c");
        
        // Send message to Branch C (should have no context from A or B)
        console.log("\n=== Testing Branch C ===");
        const responseC1 = await manager.sendMessage("branch-c", "Tell me about machine learning.");
        console.log("Branch C Response 1:", responseC1);
        
        // Check histories
        console.log("\n=== Checking Branch Histories ===");
        console.log("Branch A History:", manager.getBranchHistory("branch-a"));
        console.log("Branch B History:", manager.getBranchHistory("branch-b"));
        console.log("Branch C History:", manager.getBranchHistory("branch-c"));
        
    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Run the test
runTest(); 