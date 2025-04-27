export function draggable(node, options = {}) {
  const { enabled = true, onDragStart, onDragMove, onDragEnd } = options;
  
  let x, y;
  let isDragging = false;
  
  function handleMouseDown(event) {
    if (!enabled) return;
    
    // Only drag if target is the header or the node itself
    const isHeader = event.target.closest('.header');
    if (!isHeader && event.target !== node) return;
    
    event.preventDefault();
    
    x = event.clientX;
    y = event.clientY;
    isDragging = true;
    
    if (onDragStart) onDragStart();
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }
  
  function handleMouseMove(event) {
    if (!isDragging) return;
    
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    
    x = event.clientX;
    y = event.clientY;
    
    if (onDragMove) onDragMove(dx, dy);
  }
  
  function handleMouseUp() {
    isDragging = false;
    
    if (onDragEnd) onDragEnd();
    
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }
  
  node.addEventListener('mousedown', handleMouseDown);
  
  return {
    destroy() {
      node.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    },
    update(newOptions) {
      const { enabled: newEnabled = true } = newOptions;
      enabled = newEnabled;
    }
  };
} 