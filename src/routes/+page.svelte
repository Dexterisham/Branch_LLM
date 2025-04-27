<script>
  import JamboardCanvas from '$lib/components/Canvas.svelte';
  let canvasComponent;
</script>

<main>
  <h1>My Jamboard</h1>
  <JamboardCanvas bind:this={canvasComponent} />
  <button on:click={() => canvasComponent.addChatToBoard()} class="add-chat-button">Add Chat</button>
</main>

<style>
  main {
    padding: 20px;
  }

  .add-chat-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 10;
  }
</style>