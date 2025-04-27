<script>
    import { v4 as uuidv4 } from 'uuid';
    import ChatComponent from './Chat.svelte'; // Import the ChatComponent
  
    let items = [];
    let dragging = false;
    let currentDragItem = null;
    let startX, startY;
    let startItemX, startItemY;
  
    function addChatToBoard() {
      // Add spacing logic to prevent overlapping
      const spacing = 20; // Minimum spacing between components
      let x, y;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        x = Math.random() * (800 - 200); // Adjust for component width
        y = Math.random() * (600 - 200); // Adjust for component height
        attempts++;
      } while (isOverlapping(x, y) && attempts < maxAttempts);
      
      items = [...items, { id: uuidv4(), type: 'chat', x, y }];
    }
    
    function isOverlapping(newX, newY) {
      return items.some(item => {
        const dx = Math.abs(item.x - newX);
        const dy = Math.abs(item.y - newY);
        return dx < 200 && dy < 200; // Minimum distance between components
      });
    }
    
    function handleDragStart(event, item) {
      dragging = true;
      currentDragItem = item;
      startX = event.clientX;
      startY = event.clientY;
      startItemX = item.x;
      startItemY = item.y;
    }
    
    function handleDragMove(event) {
      if (!dragging || !currentDragItem) return;
      
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      
      currentDragItem.x = startItemX + dx;
      currentDragItem.y = startItemY + dy;
      
      items = items; // Trigger reactivity
    }
    
    function handleDragEnd() {
      dragging = false;
      currentDragItem = null;
    }
    
    // Export the function using Svelte's export syntax
    export { addChatToBoard };
</script>
  
<div class="jamboard-container" 
     on:mousemove={handleDragMove}
     on:mouseup={handleDragEnd}
     on:mouseleave={handleDragEnd}>
  {#each items as item (item.id)}
    {#if item.type === 'chat'}
      <div 
        class="chat-container"
        style="position: absolute; left: {item.x}px; top: {item.y}px;"
        on:mousedown={(e) => handleDragStart(e, item)}>
        <ChatComponent />
      </div>
    {/if}
  {/each}
</div>
  
<style>
    .jamboard-container {
      position: relative;
      width: 2000px;
      height: 1500px;
      background-color: #f0f0f0;
      overflow: auto;
      border: 1px solid #ccc;
    }
    
    .chat-container {
      cursor: move;
      user-select: none;
    }
    
    .chat-container:active {
      cursor: grabbing;
    }
</style>