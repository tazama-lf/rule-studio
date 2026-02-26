
export const withCursorPreservation = <T extends HTMLInputElement | HTMLTextAreaElement>(
  handler: (event: React.ChangeEvent<T>) => void
) => {
  return (event: React.ChangeEvent<T>) => {
    const target = event.target as T;
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    
    handler(event);
    
    requestAnimationFrame(() => {
      if (target && document.activeElement === target) {
        try {
          target.setSelectionRange(start, end);
        } catch {
          // Ignore errors (e.g., for input types that don't support selection)
        }
      }
    });
  };
};
