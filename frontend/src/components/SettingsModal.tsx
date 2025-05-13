import React, { useState } from 'react';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalPrompt: string;
  onSaveGlobalPrompt: (prompt: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  globalPrompt,
  onSaveGlobalPrompt,
}) => {
  const [prompt, setPrompt] = useState(globalPrompt);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveGlobalPrompt(prompt);
      onClose();
    } catch (error) {
      console.error('Failed to save global prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Global Chat Prompt</h3>
            <p className={styles.description}>
              This prompt will be used as the default system message for all new chats.
              You can override this on a per-chat basis.
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your default system prompt..."
              className={styles.promptInput}
              disabled={isSaving}
            />
          </div>
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

export default SettingsModal; 