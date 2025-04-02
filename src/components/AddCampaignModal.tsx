import React, { FormEvent, useState } from 'react';
import { Country, NewCampaignInput } from '../types/campaign'; // Assuming Enums are here

interface AddCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCampaign: (newCampaignData: NewCampaignInput) => Promise<void>; // Make async
}

const AddCampaignModal: React.FC<AddCampaignModalProps> = ({ isOpen, onClose, onAddCampaign }) => {
  const [country, setCountry] = useState<Country | string>(Country.DE); // Default or first enum value
  const [keyword, setKeyword] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number | ''>(''); // Use '' for empty number input
  const [currentRank, setCurrentRank] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCountry(Country.DE);
    setKeyword('');
    setDifficulty('');
    setCurrentRank('');
    setError(null);
    setIsSubmitting(false);
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!keyword.trim()) {
         setError("Keyword darf nicht leer sein.");
         return;
    }

    const newCampaignData: NewCampaignInput = {
      country: country,
      keyword: keyword.trim(),
      difficulty: difficulty === '' ? null : Number(difficulty), // Convert back to number or null
      currentRank: currentRank === '' ? null : Number(currentRank),
    };

    setIsSubmitting(true);
    try {
      await onAddCampaign(newCampaignData);
      resetForm();
      onClose(); // Close modal on success
    } catch (err) {
      console.error("Fehler beim Hinzufügen der Kampagne:", err);
      setError("Kampagne konnte nicht hinzugefügt werden. Bitte versuche es erneut.");
      setIsSubmitting(false); // Keep modal open on error
    }
    // No need to set isSubmitting to false on success, as the modal closes
  };

  if (!isOpen) {
    return null;
  }

  // Basic Modal Structure (improve styling/use a library later)
  return (
    <div className="modal-backdrop" onClick={onClose}> {/* Basic backdrop */}
      <div className="modal-content" onClick={e => e.stopPropagation()}> {/* Prevent closing on content click */}
        <h2>Neue Kampagne hinzufügen</h2>
        <form onSubmit={handleSubmit}>
          {/* Country Select */}
          <div>
            <label htmlFor="country">Land:</label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value as Country | string)} // Adjust type as needed
              required
              disabled={isSubmitting}
            >
              {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
              {/* Add an option for 'Other' if using string flexibility */}
            </select>
          </div>

          {/* Keyword Input */}
          <div>
            <label htmlFor="keyword">Keyword:</label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Difficulty Input */}
          <div>
            <label htmlFor="difficulty">Difficulty:</label>
            <input
              type="number"
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value === '' ? '' : Number(e.target.value))}
              min="0" // Optional: Set min/max if applicable
              step="1"
              disabled={isSubmitting}
            />
          </div>

          {/* Current Rank Input */}
          <div>
            <label htmlFor="currentRank">Current Rank:</label>
            <input
              type="number"
              id="currentRank"
              value={currentRank}
              onChange={(e) => setCurrentRank(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              step="1"
              disabled={isSubmitting}
            />
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>Abbrechen</button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Speichern...' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
      {/* Add some basic CSS for .modal-backdrop and .modal-content */}
      <style jsx global>{`
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
        label { display: block; margin-bottom: 5px; }
        input, select { width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default AddCampaignModal;