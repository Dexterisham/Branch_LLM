<script>
    import { onMount } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    import Chat from './Chat.svelte';

    let chats = [];
    let nextPosition = { x: 50, y: 50 };

    function addChatToBoard(parentId = null) {
        const id = uuidv4();
        const position = { ...nextPosition };
        
        // Update next position for future chats
        nextPosition.x += 320; // Width of chat + margin
        if (nextPosition.x > window.innerWidth - 350) {
            nextPosition.x = 50;
            nextPosition.y += 420; // Height of chat + margin
        }

        chats = [...chats, { id, position, parentId }];
    }

    function handleCreateBranch(event) {
        const { parentBranchId } = event.detail;
        addChatToBoard(parentBranchId);
    }

    onMount(() => {
        // Add initial chat
        addChatToBoard();
        
        // Listen for branch creation events
        document.addEventListener('createBranch', handleCreateBranch);
        
        return () => {
            document.removeEventListener('createBranch', handleCreateBranch);
        };
    });
</script>

<div class="canvas">
    {#each chats as chat}
        <Chat
            id={chat.id}
            position={chat.position}
            parentId={chat.parentId}
        />
    {/each}
</div>

<style>
    .canvas {
        position: relative;
        width: 100%;
        height: 100vh;
        background: #f5f5f5;
        overflow: auto;
    }
</style>