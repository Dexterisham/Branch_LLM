<!-- ChatComponent.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    
    // Props for component
    export let branchId = uuidv4(); // Each chat component gets a unique ID
    export let parentBranchId = null; // For branching from existing conversations
    
    // Component state
    let messages = [];
    let userInput = "";
    let isLoading = false;
    let branchName = `Branch ${branchId.slice(0, 4)}`;
    
    // API functions for LangChain interaction
    async function createBranch() {
      try {
        const response = await fetch('/api/branch/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch_id: branchId, parent_branch_id: parentBranchId })
        });
        
        if (!response.ok) throw new Error('Failed to create branch');
        
        // If this is a child branch, load parent history
        if (parentBranchId) {
          await loadBranchHistory();
        }
      } catch (error) {
        console.error('Error creating branch:', error);
      }
    }
    
    async function loadBranchHistory() {
      try {
        const response = await fetch(`/api/branch/${branchId}/history`);
        if (!response.ok) throw new Error('Failed to load history');
        
        const data = await response.json();
        messages = data.history || [];
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
    
    async function sendMessage() {
      if (!userInput.trim()) return;
      
      const userMessage = userInput;
      userInput = ""; // Clear input
      
      // Add user message to UI immediately
      messages = [...messages, { role: 'user', content: userMessage }];
      isLoading = true;
      
      try {
        const response = await fetch('/api/branch/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, branch_id: branchId })
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        const data = await response.json();
        
        // Add AI response to messages
        messages = [...messages, { role: 'assistant', content: data.response }];
      } catch (error) {
        console.error('Error sending message:', error);
        messages = [...messages, { role: 'system', content: 'Error: Could not get response' }];
      } finally {
        isLoading = false;
      }
    }
    
    function createNewBranch() {
      // Dispatch event to parent component to create new branched chat
      const event = new CustomEvent('createBranch', {
        detail: { parentBranchId: branchId }
      });
      document.dispatchEvent(event);
    }
    
    // Initialize component
    onMount(async () => {
      await createBranch();
    });
  </script>
  
  <div class="chat-box">
    <div class="chat-header">
      <input 
        bind:value={branchName}
        class="branch-name-input"
        placeholder="Branch name"
      />
      <button class="branch-btn" on:click={createNewBranch}>
        Branch
      </button>
    </div>
    
    <div class="messages-container">
      {#each messages as message}
        <div class="message {message.role}">
          <div class="message-content">{message.content}</div>
        </div>
      {/each}
      
      {#if isLoading}
        <div class="loading-indicator">
          Thinking...
        </div>
      {/if}
    </div>
    
    <div class="input-area">
      <textarea 
        bind:value={userInput}
        placeholder="Type your message..."
        on:keydown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      ></textarea>
      <button on:click={sendMessage} disabled={isLoading}>
        Send
      </button>
    </div>
  </div>
  
  <style>
    .chat-box {
      width: 350px;
      height: 400px;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      background: white;
    }
    
    .chat-header {
      display: flex;
      padding: 10px;
      background: #4a4a4a;
      color: white;
      align-items: center;
    }
    
    .branch-name-input {
      flex: 1;
      background: transparent;
      border: none;
      color: white;
      font-weight: bold;
      padding: 5px;
    }
    
    .branch-btn {
      background: #7289da;
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      color: white;
      cursor: pointer;
    }
    
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .message {
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 16px;
      margin: 2px 0;
    }
    
    .message.user {
      align-self: flex-end;
      background: #7289da;
      color: white;
    }
    
    .message.assistant {
      align-self: flex-start;
      background: #f0f0f0;
      color: #333;
    }
    
    .message.system {
      align-self: center;
      background: #ffcccc;
      color: #cc0000;
      font-size: 0.8em;
    }
    
    .input-area {
      display: flex;
      padding: 10px;
      background: #f0f0f0;
      border-top: 1px solid #ddd;
    }
    
    textarea {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
      resize: none;
      height: 40px;
    }
    
    button {
      margin-left: 8px;
      background: #7289da;
      border: none;
      border-radius: 4px;
      color: white;
      padding: 0 15px;
      cursor: pointer;
    }
    
    button:disabled {
      background: #a9a9a9;
    }
    
    .loading-indicator {
      align-self: center;
      color: #666;
      font-style: italic;
      margin: 5px 0;
    }
  </style>