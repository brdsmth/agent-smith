import React, { useState, useEffect } from 'react';
import { Close as CloseIcon } from '@mui/icons-material';
import styles from './ModelCreator.module.css';

interface ModelCreatorProps {
  availableModels: Array<{
    model_id: string;
    name: string;
  }>;
  onModelCreated: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ModelCreator: React.FC<ModelCreatorProps> = ({ 
  availableModels, 
  onModelCreated, 
  isOpen,
  onClose 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [baseModel, setBaseModel] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [error, setError] = useState('');

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setBaseModel('');
      setNewModelName('');
      setSystemPrompt('');
      setTemperature(0.7);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const response = await fetch('http://localhost:8000/v1/models/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          base_model: baseModel,
          new_model_name: newModelName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          system_prompt: systemPrompt,
          temperature: temperature,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create model');
      }

      onModelCreated();
      onClose();
    } catch (err) {
      console.error('Error creating model:', err);
      setError(err instanceof Error ? err.message : 'Failed to create model');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle clicking outside to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
        onClick={handleOverlayClick}
      />
      <div className={`${styles.container} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Create New Model</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="baseModel">Base Model</label>
            <select
              id="baseModel"
              value={baseModel}
              onChange={(e) => setBaseModel(e.target.value)}
              required
            >
              <option value="">Select a base model</option>
              {availableModels.map((model) => (
                <option key={model.model_id} value={model.model_id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="newModelName">New Model Name</label>
            <input
              id="newModelName"
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="e.g., my-custom-mistral"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="systemPrompt">System Prompt</label>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define the model's behavior..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="temperature">
              Temperature ({temperature})
            </label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Model'}
          </button>
        </form>
      </div>
    </>
  );
};

export default ModelCreator; 