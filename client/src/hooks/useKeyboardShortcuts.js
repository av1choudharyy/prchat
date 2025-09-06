import { useEffect } from 'react';

const useKeyboardShortcuts = ({
  onSearch,
  onReply,
  onForward,
  onSend,
  onToggleBold,
  onToggleItalic,
  onShowHelp,
  onEscape
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, ctrlKey, metaKey, altKey } = event;
      const isCmd = ctrlKey || metaKey;
      
      if (key === '/' && !event.target.matches('input, textarea')) {
        event.preventDefault();
        onSearch?.();
        return;
      }
      
      if (isCmd && key === 'f') {
        event.preventDefault();
        onSearch?.();
        return;
      }
      
      if (key === 'Escape') {
        event.preventDefault();
        onEscape?.();
        return;
      }
      
      if (key === '?' && !event.target.matches('input, textarea')) {
        event.preventDefault();
        onShowHelp?.();
        return;
      }
      
      if (event.target.matches('input, textarea')) {
        if (altKey && key === 's') {
          event.preventDefault();
          onSend?.();
          return;
        }
        
        if (isCmd && key === 'b') {
          event.preventDefault();
          onToggleBold?.();
          return;
        }
        
        if (isCmd && key === 'i') {
          event.preventDefault();
          onToggleItalic?.();
          return;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onReply, onForward, onSend, onToggleBold, onToggleItalic, onShowHelp, onEscape]);
};

export default useKeyboardShortcuts;