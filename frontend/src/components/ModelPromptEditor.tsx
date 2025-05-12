import React, { useState, useEffect } from 'react';
import styles from './ModelPromptEditor.module.css';

interface ModelPromptEditorProps {
  modelId: string;
  onPromptChange: (prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ModelPromptEditor: React.FC<ModelPromptEditorProps> = ({
  modelId,
  onPromptChange,
  isOpen,
  onClose,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && modelId) {
      fetchCurrentPrompt();
    }
  }, [isOpen, modelId]);

  const fetchCurrentPrompt = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/models/${modelId}/prompt`);
      if (!response.ok) throw new Error('Failed to fetch prompt');
      const data = await response.json();
      setPrompt(data.prompt || '');
    } catch (error) {
      console.error('Error fetching prompt:', error);
      setPrompt('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/v1/models/${modelId}/prompt`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        }
      );
      if (!response.ok) throw new Error('Failed to update prompt');
      onPromptChange(prompt);
      onClose();
    } catch (error) {
      console.error('Error updating prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Edit Model Prompt</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.content}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter system prompt..."
            className={styles.promptInput}
            disabled={isLoading}
          />
        </div>
        <div className={styles.footer}>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={styles.saveButton}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelPromptEditor; 