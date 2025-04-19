<script>
    // Chat state
    let messages = [];
    let input = '';
    let isLoading = false;
    let selectedModel = '';
    let contextInfo = {
        totalTokens: 0,
        limit: 0,
        remaining: 0
    };
  
    // Available Ollama models and their context limits (approximate)
    const modelContextLimits = {
        'mistral': 8192,
       
        'gemma3': 128000
    };

    const models = Object.keys(modelContextLimits);
   
    // Function to estimate tokens (rough approximation)
    function estimateTokens(text) {
        // Rough estimation: ~4 characters per token on average
        return Math.ceil(text.length / 4);
    }

    // Update context window information
    function updateContextInfo() {
        const totalTokens = messages.reduce((sum, msg) => 
            sum + estimateTokens(msg.content), 0);
        
        contextInfo = {
            totalTokens,
            limit: modelContextLimits[selectedModel],
            remaining: modelContextLimits[selectedModel] - totalTokens
        };
    }

    // Watch for model changes
    $: selectedModel, updateContextInfo();
    // Watch for message changes
    $: messages, updateContextInfo();
   
    async function handleSubmit() {
        if (!input.trim() || isLoading) return;

        // Estimate new message tokens
        const newMessageTokens = estimateTokens(input);
        if (contextInfo.remaining < newMessageTokens) {
            // Remove oldest messages until we have space
            while (contextInfo.remaining < newMessageTokens && messages.length > 0) {
                messages = messages.slice(2); // Remove oldest pair of messages
                updateContextInfo();
            }
        }
  
        // Add user message
        messages = [...messages, { role: 'user', content: input }];
        const userInput = input;
        input = '';
        isLoading = true;
  
        // Add empty assistant message that we'll stream into
        messages = [...messages, { role: 'assistant', content: '' }];
        const assistantIndex = messages.length - 1;
   
        try {
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        ...messages.slice(0, -1),
                        { role: 'user', content: userInput }
                    ],
                    stream: true,
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
          
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
          
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            messages[assistantIndex].content += data.message.content;
                            messages = messages; // trigger Svelte reactivity
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
            messages[assistantIndex].content = 'Error: ' + err.message;
            messages = messages;
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="chat-container">
    <h2>Ollama Chat ({selectedModel})</h2>
    
    <div class="model-selector">
        <label for="model">Model:</label>
        <select id="model" bind:value={selectedModel}>
            {#each models as model}
                <option value={model}>{model}</option>
            {/each}
        </select>
    </div>

    <div class="context-info">
        <div class="context-bar">
            <div 
                class="context-used" 
                style="width: {(contextInfo.totalTokens / contextInfo.limit) * 100}%"
                class:context-warning={contextInfo.remaining < contextInfo.limit * 0.2}
            ></div>
        </div>
        <div class="context-stats">
            <span>Used: ~{contextInfo.totalTokens} tokens</span>
            <span>Remaining: ~{contextInfo.remaining} tokens</span>
            <span>Limit: {contextInfo.limit} tokens</span>
        </div>
    </div>
    
    <div class="messages">
        {#each messages as message, i}
            <div class="message {message.role}">
                <strong>{message.role === 'user' ? 'You' : 'AI'}:</strong>
                <p>{message.content}</p>
                <small class="token-count">~{estimateTokens(message.content)} tokens</small>
            </div>
        {/each}
        {#if isLoading}
            <div class="typing-indicator">AI is typing...</div>
        {/if}
    </div>
    
    <form on:submit|preventDefault={handleSubmit}>
        <input 
            type="text" 
            bind:value={input} 
            placeholder="Type your message..." 
            disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
        </button>
    </form>
</div>

<style>
    .chat-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: sans-serif;
    }
    
    .model-selector {
        margin-bottom: 15px;
    }
    
    .context-info {
        margin-bottom: 15px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
    }

    .context-bar {
        height: 8px;
        background: #eee;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
    }

    .context-used {
        height: 100%;
        background: #4CAF50;
        transition: width 0.3s ease;
    }

    .context-used.context-warning {
        background: #ff9800;
    }

    .context-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.8em;
        color: #666;
    }
    
    select {
        padding: 5px;
        margin-left: 10px;
    }
    
    .messages {
        height: 400px;
        overflow-y: auto;
        margin-bottom: 15px;
        padding: 10px;
        background: #f9f9f9;
        border-radius: 4px;
    }
    
    .message {
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 4px;
        position: relative;
    }
    
    .message.user {
        background: #e3f2fd;
        margin-left: 20%;
    }
    
    .message.assistant {
        background: #f5f5f5;
        margin-right: 20%;
    }

    .token-count {
        position: absolute;
        bottom: 2px;
        right: 5px;
        font-size: 0.7em;
        color: #666;
        opacity: 0.7;
    }
    
    .typing-indicator {
        color: #666;
        font-style: italic;
        padding: 8px;
    }
    
    form {
        display: flex;
        gap: 10px;
    }
    
    input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    button {
        padding: 8px 15px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    button:disabled {
        background: #cccccc;
        cursor: not-allowed;
    }
</style>