import React, { useState } from 'react';
import styles from './ChatPromptEditor.module.css';

interface ChatPromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentPrompt: string;
  onSavePrompt: (chatId: string, prompt: string) => Promise<void>;
}

const ChatPromptEditor: React.FC<ChatPromptEditorProps> = ({
  isOpen,
  onClose,
  chatId,
  currentPrompt,
  onSavePrompt,
}) => {
  const [prompt, setPrompt] = useState(currentPrompt);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePrompt(chatId, prompt);
      onClose();
    } catch (error) {
      console.error('Failed to save chat prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Edit Chat Prompt</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.content}>
          <p className={styles.description}>
            This prompt will be used as the system message for this specific chat.
            It overrides the global prompt settings.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter chat-specific system prompt..."
            className={styles.promptInput}
            disabled={isSaving}
          />
        </div>

        <div className={styles.footer}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={styles.saveButton}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPromptEditor; 