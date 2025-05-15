<!-- ChatComponent.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    import { createBranch, sendMessage, getBranchHistory } from '../services/api';
    
    // Props for component
    export let id;
    export let position = { x: 0, y: 0 };
    export let parentId = null;
    
    // Component state
    let messages = [];
    let inputMessage = "";
    let isLoading = false;
    let branchName = `Branch ${id.slice(0, 4)}`;
    
    // Initialize component
    onMount(async () => {
      try {
        // Create new branch
        await createBranch(id, parentId);
        
        // Load history if this is a child branch
        if (parentId) {
          const history = await getBranchHistory(id);
          if (history.success) {
            messages = history.history;
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    });
    
    async function handleSubmit() {
      if (!inputMessage.trim()) return;
      
      isLoading = true;
      try {
        // Add user message to UI
        messages = [...messages, { role: 'user', content: inputMessage }];
        
        // Send to server
        const response = await sendMessage(id, inputMessage);
        
        if (response.success) {
          // Add AI response to UI
          messages = [...messages, { role: 'assistant', content: response.response }];
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        isLoading = false;
        inputMessage = '';
      }
    }
    
    function createNewBranch() {
      // Dispatch event to parent component to create new branched chat
      const event = new CustomEvent('createBranch', {
        detail: { parentBranchId: id }
      });
      document.dispatchEvent(event);
    }
  </script>
  
  <div class="chat-container" style="left: {position.x}px; top: {position.y}px;">
    <div class="chat-header">
      <h3>Chat {id}</h3>
      {#if parentId}
        <span class="parent-info">Branch from {parentId}</span>
      {/if}
      <button class="branch-btn" on:click={createNewBranch}>
        Branch
      </button>
    </div>
    
    <div class="messages">
      {#each messages as message}
        <div class="message {message.role}">
          {message.content}
        </div>
      {/each}
      
      {#if isLoading}
        <div class="message assistant loading">Thinking...</div>
      {/if}
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="input-form">
      <input
        type="text"
        bind:value={inputMessage}
        placeholder="Type your message..."
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !inputMessage.trim()}>
        Send
      </button>
    </form>
  </div>
  
  <style>
    .chat-container {
      position: absolute;
      width: 300px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      height: 400px;
    }
    
    .chat-header {
      padding: 10px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .parent-info {
      font-size: 0.8em;
      color: #666;
    }
    
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    
    .message {
      margin: 5px 0;
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 80%;
    }
    
    .message.user {
      background: #007bff;
      color: white;
      margin-left: auto;
    }
    
    .message.assistant {
      background: #f0f0f0;
      margin-right: auto;
    }
    
    .message.loading {
      opacity: 0.7;
    }
    
    .input-form {
      display: flex;
      padding: 10px;
      border-top: 1px solid #eee;
    }
    
    input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-right: 8px;
    }
    
    button {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  </style>