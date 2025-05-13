import React, { useState, useEffect } from 'react';
import styles from './SettingsModal.module.css';
import { getEncryptionEnabled, setEncryptionEnabled, getOrGenerateKeys } from '../utils/secureStorage';
import { keyToString } from '../utils/encryption';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalPrompt: string;
  onSaveGlobalPrompt: (prompt: string) => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  globalPrompt,
  onSaveGlobalPrompt,
}) => {
  const [prompt, setPrompt] = useState(globalPrompt);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(getEncryptionEnabled());
  const [publicKey, setPublicKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrompt(globalPrompt);
      setIsEncryptionEnabled(getEncryptionEnabled());
      const keys = getOrGenerateKeys();
      setPublicKey(keyToString(keys.publicKey));
    }
  }, [isOpen, globalPrompt]);

  const handleSave = async () => {
    await onSaveGlobalPrompt(prompt);
    setEncryptionEnabled(isEncryptionEnabled);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Settings</h2>
        
        <div className={styles.section}>
          <h3>Global Prompt</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your global system prompt..."
            className={styles.textarea}
          />
        </div>

        <div className={styles.section}>
          <h3>Security Settings</h3>
          <div className={styles.setting}>
            <label className={styles.label}>
              <input
                type="checkbox"
                checked={isEncryptionEnabled}
                onChange={(e) => setIsEncryptionEnabled(e.target.checked)}
              />
              Enable End-to-End Encryption
            </label>
            <p className={styles.description}>
              When enabled, all messages will be encrypted before being sent to the server.
              This provides additional security but may slightly impact performance.
            </p>
          </div>

          {isEncryptionEnabled && (
            <div className={styles.keyInfo}>
              <h4>Your Public Key</h4>
              <code className={styles.keyDisplay}>{publicKey}</code>
              <p className={styles.description}>
                This is your public key used for encryption. The server uses this to encrypt responses back to you.
              </p>
            </div>
          )}
        </div>

        <div className={styles.buttons}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveButton}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 