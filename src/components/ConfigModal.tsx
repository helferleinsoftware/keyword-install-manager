// src/components/ConfigModal.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage'; // Reuse the hook
import { COST_PER_INSTALL_KEY, DEFAULT_FILTER_RANGE_DIFFICULTY, DEFAULT_FILTER_RANGE_RANK, FILTER_RANGE_DIFFICULTY_KEY, FILTER_RANGE_RANK_KEY } from '../types/config';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define keys for localStorage items


const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  // Use the hook for each setting
  const [costPerInstall, setCostPerInstall] = useLocalStorage<number | ''>(COST_PER_INSTALL_KEY, '');
  const [filterRangeDifficulty, setFilterRangeDifficulty] = useLocalStorage<number | ''>(FILTER_RANGE_DIFFICULTY_KEY, DEFAULT_FILTER_RANGE_DIFFICULTY);
  const [filterRangeRank, setFilterRangeRank] = useLocalStorage<number | ''>(FILTER_RANGE_RANK_KEY, DEFAULT_FILTER_RANGE_RANK);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    // The useLocalStorage hook already saves on change,
    // but we can simulate a save process and give feedback
    setTimeout(() => {
        // We need to ensure the type stored is number or null, not empty string
        localStorage.setItem(COST_PER_INSTALL_KEY, JSON.stringify(costPerInstall === '' ? null : Number(costPerInstall)));
        localStorage.setItem(FILTER_RANGE_DIFFICULTY_KEY, JSON.stringify(filterRangeDifficulty === '' ? null : Number(filterRangeDifficulty)));
        localStorage.setItem(FILTER_RANGE_RANK_KEY, JSON.stringify(filterRangeRank === '' ? null : Number(filterRangeRank)));

        setIsSaving(false);
        setSaveMessage("Einstellungen gespeichert!");
        // Optionally close modal after a short delay
        setTimeout(() => {
            setSaveMessage(null);
            onClose();
        }, 1500);
    }, 500); // Simulate network delay/save time
  };

  // Reset message when modal is opened
  useEffect(() => {
      if (isOpen) {
          setSaveMessage(null);
      }
  }, [isOpen]);


  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Konfiguration</h2>
        <form onSubmit={handleSubmit}>
          {/* Cost per Install */}
          <div>
            <label htmlFor="costPerInstall">Kosten pro Installation (€):</label>
            <input
              type="number"
              id="costPerInstall"
              value={costPerInstall}
              onChange={(e) => setCostPerInstall(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              step="0.01" // Allow cents
              placeholder="z.B. 0.15"
              disabled={isSaving}
            />
          </div>

          {/* Filter Range Difficulty */}
          <div>
            <label htmlFor="filterRangeDifficulty">Filter-Range Difficulty (+/-):</label>
            <input
              type="number"
              id="filterRangeDifficulty"
              value={filterRangeDifficulty}
              onChange={(e) => setFilterRangeDifficulty(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              step="1"
              placeholder="z.B. 5"
              required // Require a value for range filters
              disabled={isSaving}
            />
          </div>

          {/* Filter Range Rank */}
          <div>
            <label htmlFor="filterRangeRank">Filter-Range Rank (+/-):</label>
            <input
              type="number"
              id="filterRangeRank"
              value={filterRangeRank}
              onChange={(e) => setFilterRangeRank(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              step="1"
              placeholder="z.B. 10"
              required // Require a value for range filters
              disabled={isSaving}
            />
          </div>

          {saveMessage && <p style={{ color: 'green' }}>{saveMessage}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSaving}>Abbrechen</button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
         {/* Re-use modal styles from AddCampaignModal */}
         <style>{`
        .modal-backdrop {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0,0,0,0.5); display: flex;
          justify-content: center; align-items: center; z-index: 1000;
        }
        .modal-content {
          background: white; padding: 20px; border-radius: 5px;
          min-width: 300px; max-width: 500px; z-index: 1001;
        }
        .modal-actions { margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px; }
            label { display: block; margin-bottom: 5px; margin-top: 10px; }
            input { width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box; }
         `}</style>
      </div>
    </div>
  );
};

export default ConfigModal;