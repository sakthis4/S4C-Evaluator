import React, { useEffect } from 'react';
import { ProctorLog } from '../types';

interface ProctoringProps {
  isActive: boolean;
  onViolation: (log: ProctorLog) => void;
}

const Proctoring: React.FC<ProctoringProps> = ({ isActive, onViolation }) => {
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onViolation({
          timestamp: Date.now(),
          type: 'TAB_SWITCH',
          details: 'User switched tabs or minimized browser'
        });
      }
    };

    const handleBlur = () => {
      onViolation({
        timestamp: Date.now(),
        type: 'LOST_FOCUS',
        details: 'Window lost focus'
      });
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation({
        timestamp: Date.now(),
        type: 'COPY_ATTEMPT',
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation({
        timestamp: Date.now(),
        type: 'PASTE_ATTEMPT',
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onViolation({
        timestamp: Date.now(),
        type: 'CONTEXT_MENU',
        details: 'Right-click menu blocked'
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isActive, onViolation]);

  return null; // Headless component
};

export default Proctoring;